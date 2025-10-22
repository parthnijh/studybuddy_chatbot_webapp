from flask import Flask,request,jsonify
from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_google_genai import GoogleGenerativeAIEmbeddings,ChatGoogleGenerativeAI
from langchain_chroma import Chroma
from langchain_core.output_parsers import StrOutputParser
from langchain_core.prompts import PromptTemplate
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
    return jsonify({"status":"uploaded"})

@app.route("/ask",methods=["POST"])
def ask():
    parser=StrOutputParser()
    ret=vectorstore.as_retriever(search_type="similarity",search_kwargs={"k":6})
    prompt=PromptTemplate(template='''You are a helpful assistant who reads everything with great detail,
                      answer this query {query} with the following context {context} ,if you cant find the answer with
                      the given context say i dont know''',input_variables=["query","context"])
    data = request.get_json()
    query = data.get("question") 

   
    palchain=RunnableParallel({
    "context":ret,
    "query":RunnablePassthrough()
})
    model=ChatGoogleGenerativeAI(model="gemini-2.5-flash",api_key=os.getenv("GOOGLE_API_KEY"))
    chain=palchain | prompt | model |parser
    result=chain.invoke(query)
    return jsonify({"answer":result})




if __name__ == "__main__":
    app.run(debug=True)
