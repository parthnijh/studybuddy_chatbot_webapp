from flask import Flask,request,jsonify
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings,ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate,ChatPromptTemplate,MessagesPlaceholder
from langchain_core.messages import HumanMessage,AIMessage
from langchain_core.runnables import RunnableLambda,RunnablePassthrough,RunnableParallel
from flask_cors import CORS
import os
from dotenv import load_dotenv
load_dotenv()
app=Flask(__name__)
CORS(app,resources={r"/*": {"origins": "*"}})
import os



embeddings=GoogleGenerativeAIEmbeddings(model="models/gemini-embedding-001",google_api_key=os.getenv("GOOGLE_API_KEY"))
vectorstore=Chroma(
        persist_directory="chroma",
        collection_name="studybuddy",
        embedding_function=embeddings
    )
@app.route("/upload",methods=["POST"])

def upload():
    file=request.files.get("file")
    if(not file):
        return  jsonify({"status":"file not found "})
    filepath = os.path.join("upload/", file.filename)
    file.save(filepath)
    
 
    loader=PyPDFLoader(file_path=filepath)
    document=loader.load()
    splitter=RecursiveCharacterTextSplitter(chunk_size=1000,chunk_overlap=200)
    chunks=[]
    for doc in document:
        chunks.extend(splitter.split_text(doc.page_content))
    
    vectorstore.add_texts(chunks)
    if os.path.exists(filepath):
            os.remove(filepath)
    return jsonify({"status":"uploaded"})

@app.route("/ask",methods=["POST"])
def ask():
    parser=StrOutputParser()
    ret=vectorstore.as_retriever(search_type="similarity",search_kwargs={"k":6})
    data = request.get_json()
    frontend_chat=data.get("chat_history",[])
    chat_history=[]
    for message in frontend_chat:
        if(message["sender"]=="user"):
            chat_history.append(HumanMessage(message["text"]))
        else:
            chat_history.append(AIMessage(message["text"]))
    print(chat_history)
    prompt=ChatPromptTemplate( messages=[
        (
            "system",
            """You are StudyBuddy, a friendly and intelligent AI assistant.

Your task:
- Carefully read the user’s query: {query}
- Use the chat history to maintain context of the conversation.
- Use the following context to answer document-based or knowledge-based questions only:
  {context}

Rules:
1. If the answer to the query can be clearly found within the context, answer it concisely and accurately using that information.
2. If the answer is not available or cannot be inferred from the provided context, respond with:
   "I don’t know based on the provided context."
3. use the chat history as a reference too before saying i dont know.
4. If the user is not asking a question — for example, if they greet you, thank you, or just chat casually — respond naturally and warmly like a human assistant.

Examples:
user: Hi  
assistant: Hey there! How’s it going?

user: How are you?  
assistant: I’m just a bunch of code, but feeling great today! How about you?

user: Thanks!  
assistant: Anytime — happy to help!

user : do you like () ?
assistant : i am an ai ,so i dont have opinions however i would love to hear yours
user: What does the document say about renewable energy policies?  
assistant: (Answer using {context} only)

user: Tell me something not in the document  
assistant: I don’t know based on the provided context."""
        ),
        MessagesPlaceholder(variable_name="chat_history"),
        ("human", "{query}")
    ]
)
    
    query = data.get("question") 
    

    context=ret.invoke(query)
#     palchain=RunnableParallel({
#     "context":ret,
#     "query":RunnablePassthrough(),
#     "chat_history":RunnablePassthrough()
# })
    

    model=ChatGoogleGenerativeAI(model="gemini-2.5-flash",api_key=os.getenv("GOOGLE_API_KEY"))
    
    chain=prompt | model |parser
    result=chain.invoke({
    "query": query,
    "context": context,         
    "chat_history": chat_history 
})
    return jsonify({"answer":result})



