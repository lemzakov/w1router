(globalThis.TURBOPACK||(globalThis.TURBOPACK=[])).push(["object"==typeof document?document.currentScript:void 0,818581,(e,t,a)=>{"use strict";Object.defineProperty(a,"__esModule",{value:!0}),Object.defineProperty(a,"useMergedRef",{enumerable:!0,get:function(){return r}});let s=e.r(271645);function r(e,t){let a=(0,s.useRef)(null),r=(0,s.useRef)(null);return(0,s.useCallback)(s=>{if(null===s){let e=a.current;e&&(a.current=null,e());let t=r.current;t&&(r.current=null,t())}else e&&(a.current=i(e,s)),t&&(r.current=i(t,s))},[e,t])}function i(e,t){if("function"!=typeof e)return e.current=t,()=>{e.current=null};{let a=e(t);return"function"==typeof a?a:()=>e(null)}}("function"==typeof a.default||"object"==typeof a.default&&null!==a.default)&&void 0===a.default.__esModule&&(Object.defineProperty(a.default,"__esModule",{value:!0}),Object.assign(a.default,a),t.exports=a.default)},62478,e=>{"use strict";var t=e.i(764205);let a=async e=>{if(!e)return null;try{return await (0,t.getProxyUISettings)(e)}catch(e){return console.error("Error fetching proxy settings:",e),null}};e.s(["fetchProxySettings",0,a])},602073,e=>{"use strict";e.i(247167);var t=e.i(931067),a=e.i(271645);let s={icon:{tag:"svg",attrs:{viewBox:"0 0 1024 1024",focusable:"false"},children:[{tag:"path",attrs:{d:"M512 64L128 192v384c0 212.1 171.9 384 384 384s384-171.9 384-384V192L512 64zm312 512c0 172.3-139.7 312-312 312S200 748.3 200 576V246l312-110 312 110v330z"}},{tag:"path",attrs:{d:"M378.4 475.1a35.91 35.91 0 00-50.9 0 35.91 35.91 0 000 50.9l129.4 129.4 2.1 2.1a33.98 33.98 0 0048.1 0L730.6 434a33.98 33.98 0 000-48.1l-2.8-2.8a33.98 33.98 0 00-48.1 0L483 579.7 378.4 475.1z"}}]},name:"safety",theme:"outlined"};var r=e.i(9583),i=a.forwardRef(function(e,i){return a.createElement(r.default,(0,t.default)({},e,{ref:i,icon:s}))});e.s(["SafetyOutlined",0,i],602073)},190272,785913,e=>{"use strict";var t,a,s=((t={}).AUDIO_SPEECH="audio_speech",t.AUDIO_TRANSCRIPTION="audio_transcription",t.IMAGE_GENERATION="image_generation",t.VIDEO_GENERATION="video_generation",t.CHAT="chat",t.RESPONSES="responses",t.IMAGE_EDITS="image_edits",t.ANTHROPIC_MESSAGES="anthropic_messages",t.EMBEDDING="embedding",t),r=((a={}).IMAGE="image",a.VIDEO="video",a.CHAT="chat",a.RESPONSES="responses",a.IMAGE_EDITS="image_edits",a.ANTHROPIC_MESSAGES="anthropic_messages",a.EMBEDDINGS="embeddings",a.SPEECH="speech",a.TRANSCRIPTION="transcription",a.A2A_AGENTS="a2a_agents",a.MCP="mcp",a.REALTIME="realtime",a);let i={image_generation:"image",video_generation:"video",chat:"chat",responses:"responses",image_edits:"image_edits",anthropic_messages:"anthropic_messages",audio_speech:"speech",audio_transcription:"transcription",embedding:"embeddings"};e.s(["EndpointType",()=>r,"getEndpointType",0,e=>{if(console.log("getEndpointType:",e),Object.values(s).includes(e)){let t=i[e];return console.log("endpointType:",t),t}return"chat"}],785913),e.s(["generateCodeSnippet",0,e=>{let t,{apiKeySource:a,accessToken:s,apiKey:i,inputMessage:l,chatHistory:n,selectedTags:o,selectedVectorStores:c,selectedGuardrails:d,selectedPolicies:m,selectedMCPServers:p,mcpServers:u,mcpServerToolRestrictions:g,selectedVoice:x,endpointType:h,selectedModel:_,selectedSdk:f,proxySettings:b}=e,v="session"===a?s:i,j=window.location.origin,y=b?.LITELLM_UI_API_DOC_BASE_URL;y&&y.trim()?j=y:b?.PROXY_BASE_URL&&(j=b.PROXY_BASE_URL);let A=l||"Your prompt here",N=A.replace(/\\/g,"\\\\").replace(/"/g,'\\"').replace(/\n/g,"\\n"),T=n.filter(e=>!e.isImage).map(({role:e,content:t})=>({role:e,content:t})),C={};o.length>0&&(C.tags=o),c.length>0&&(C.vector_stores=c),d.length>0&&(C.guardrails=d),m.length>0&&(C.policies=m);let S=_||"your-model-name",I="azure"===f?`import openai

client = openai.AzureOpenAI(
	api_key="${v||"YOUR_LITELLM_API_KEY"}",
	azure_endpoint="${j}",
	api_version="2024-02-01"
)`:`import openai

client = openai.OpenAI(
	api_key="${v||"YOUR_LITELLM_API_KEY"}",
	base_url="${j}"
)`;switch(h){case r.CHAT:{let e=Object.keys(C).length>0,a="";if(e){let e=JSON.stringify({metadata:C},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();a=`,
    extra_body=${e}`}let s=T.length>0?T:[{role:"user",content:A}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.chat.completions.create(
    model="${S}",
    messages=${JSON.stringify(s,null,4)}${a}
)

print(response)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.chat.completions.create(
#     model="${S}",
#     messages=[
#         {
#             "role": "user",
#             "content": [
#                 {
#                     "type": "text",
#                     "text": "${N}"
#                 },
#                 {
#                     "type": "image_url",
#                     "image_url": {
#                         "url": f"data:image/jpeg;base64,{base64_file}"  # or data:application/pdf;base64,{base64_file}
#                     }
#                 }
#             ]
#         }
#     ]${a}
# )
# print(response_with_file)
`;break}case r.RESPONSES:{let e=Object.keys(C).length>0,a="";if(e){let e=JSON.stringify({metadata:C},null,2).split("\n").map(e=>" ".repeat(4)+e).join("\n").trim();a=`,
    extra_body=${e}`}let s=T.length>0?T:[{role:"user",content:A}];t=`
import base64

# Helper function to encode images to base64
def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        return base64.b64encode(image_file.read()).decode('utf-8')

# Example with text only
response = client.responses.create(
    model="${S}",
    input=${JSON.stringify(s,null,4)}${a}
)

print(response.output_text)

# Example with image or PDF (uncomment and provide file path to use)
# base64_file = encode_image("path/to/your/file.jpg")  # or .pdf
# response_with_file = client.responses.create(
#     model="${S}",
#     input=[
#         {
#             "role": "user",
#             "content": [
#                 {"type": "input_text", "text": "${N}"},
#                 {
#                     "type": "input_image",
#                     "image_url": f"data:image/jpeg;base64,{base64_file}",  # or data:application/pdf;base64,{base64_file}
#                 },
#             ],
#         }
#     ]${a}
# )
# print(response_with_file.output_text)
`;break}case r.IMAGE:t="azure"===f?`
# NOTE: The Azure SDK does not have a direct equivalent to the multi-modal 'responses.create' method shown for OpenAI.
# This snippet uses 'client.images.generate' and will create a new image based on your prompt.
# It does not use the uploaded image, as 'client.images.generate' does not support image inputs in this context.
import os
import requests
import json
import time
from PIL import Image

result = client.images.generate(
	model="${S}",
	prompt="${l}",
	n=1
)

json_response = json.loads(result.model_dump_json())

# Set the directory for the stored image
image_dir = os.path.join(os.curdir, 'images')

# If the directory doesn't exist, create it
if not os.path.isdir(image_dir):
	os.mkdir(image_dir)

# Initialize the image path
image_filename = f"generated_image_{int(time.time())}.png"
image_path = os.path.join(image_dir, image_filename)

try:
	# Retrieve the generated image
	if json_response.get("data") && len(json_response["data"]) > 0 && json_response["data"][0].get("url"):
			image_url = json_response["data"][0]["url"]
			generated_image = requests.get(image_url).content
			with open(image_path, "wb") as image_file:
					image_file.write(generated_image)

			print(f"Image saved to {image_path}")
			# Display the image
			image = Image.open(image_path)
			image.show()
	else:
			print("Could not find image URL in response.")
			print("Full response:", json_response)
except Exception as e:
	print(f"An error occurred: {e}")
	print("Full response:", json_response)
`:`
import base64
import os
import time
import json
from PIL import Image
import requests

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# Helper function to create a file (simplified for this example)
def create_file(image_path):
	# In a real implementation, this would upload the file to OpenAI
	# For this example, we'll just return a placeholder ID
	return f"file_{os.path.basename(image_path).replace('.', '_')}"

# The prompt entered by the user
prompt = "${N}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${S}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`;break;case r.IMAGE_EDITS:t="azure"===f?`
import base64
import os
import time
import json
from PIL import Image
import requests

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# The prompt entered by the user
prompt = "${N}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${S}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`:`
import base64
import os
import time

# Helper function to encode images to base64
def encode_image(image_path):
	with open(image_path, "rb") as image_file:
			return base64.b64encode(image_file.read()).decode('utf-8')

# Helper function to create a file (simplified for this example)
def create_file(image_path):
	# In a real implementation, this would upload the file to OpenAI
	# For this example, we'll just return a placeholder ID
	return f"file_{os.path.basename(image_path).replace('.', '_')}"

# The prompt entered by the user
prompt = "${N}"

# Encode images to base64
base64_image1 = encode_image("body-lotion.png")
base64_image2 = encode_image("soap.png")

# Create file IDs
file_id1 = create_file("body-lotion.png")
file_id2 = create_file("incense-kit.png")

response = client.responses.create(
	model="${S}",
	input=[
			{
					"role": "user",
					"content": [
							{"type": "input_text", "text": prompt},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image1}",
							},
							{
									"type": "input_image",
									"image_url": f"data:image/jpeg;base64,{base64_image2}",
							},
							{
									"type": "input_image",
									"file_id": file_id1,
							},
							{
									"type": "input_image",
									"file_id": file_id2,
							}
					],
			}
	],
	tools=[{"type": "image_generation"}],
)

# Process the response
image_generation_calls = [
	output
	for output in response.output
	if output.type == "image_generation_call"
]

image_data = [output.result for output in image_generation_calls]

if image_data:
	image_base64 = image_data[0]
	image_filename = f"edited_image_{int(time.time())}.png"
	with open(image_filename, "wb") as f:
			f.write(base64.b64decode(image_base64))
	print(f"Image saved to {image_filename}")
else:
	# If no image is generated, there might be a text response with an explanation
	text_response = [output.text for output in response.output if hasattr(output, 'text')]
	if text_response:
			print("No image generated. Model response:")
			print("\\n".join(text_response))
	else:
			print("No image data found in response.")
	print("Full response for debugging:")
	print(response)
`;break;case r.EMBEDDINGS:t=`
response = client.embeddings.create(
	input="${l||"Your string here"}",
	model="${S}",
	encoding_format="base64" # or "float"
)

print(response.data[0].embedding)
`;break;case r.TRANSCRIPTION:t=`
# Open the audio file
audio_file = open("path/to/your/audio/file.mp3", "rb")

# Make the transcription request
response = client.audio.transcriptions.create(
	model="${S}",
	file=audio_file${l?`,
	prompt="${l.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`:""}
)

print(response.text)
`;break;case r.SPEECH:t=`
# Make the text-to-speech request
response = client.audio.speech.create(
	model="${S}",
	input="${l||"Your text to convert to speech here"}",
	voice="${x}"  # Options: alloy, ash, ballad, coral, echo, fable, nova, onyx, sage, shimmer
)

# Save the audio to a file
output_filename = "output_speech.mp3"
response.stream_to_file(output_filename)
print(f"Audio saved to {output_filename}")

# Optional: Customize response format and speed
# response = client.audio.speech.create(
#     model="${S}",
#     input="${l||"Your text to convert to speech here"}",
#     voice="alloy",
#     response_format="mp3",  # Options: mp3, opus, aac, flac, wav, pcm
#     speed=1.0  # Range: 0.25 to 4.0
# )
# response.stream_to_file("output_speech.mp3")
`;break;default:t="\n# Code generation for this endpoint is not implemented yet."}return`${I}
${t}`}],190272)},879664,e=>{"use strict";let t=(0,e.i(475254).default)("info",[["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}],["path",{d:"M12 16v-4",key:"1dtifu"}],["path",{d:"M12 8h.01",key:"e9boi3"}]]);e.s(["default",()=>t])},916925,e=>{"use strict";var t,a=((t={}).A2A_Agent="A2A Agent",t.AI21="Ai21",t.AI21_CHAT="Ai21 Chat",t.AIML="AI/ML API",t.AIOHTTP_OPENAI="Aiohttp Openai",t.Anthropic="Anthropic",t.ANTHROPIC_TEXT="Anthropic Text",t.AssemblyAI="AssemblyAI",t.AUTO_ROUTER="Auto Router",t.Bedrock="Amazon Bedrock",t.BedrockMantle="Amazon Bedrock Mantle",t.SageMaker="AWS SageMaker",t.Azure="Azure",t.Azure_AI_Studio="Azure AI Foundry (Studio)",t.AZURE_TEXT="Azure Text",t.BASETEN="Baseten",t.BYTEZ="Bytez",t.Cerebras="Cerebras",t.CLARIFAI="Clarifai",t.CLOUDFLARE="Cloudflare",t.CODESTRAL="Codestral",t.Cohere="Cohere",t.COHERE_CHAT="Cohere Chat",t.COMETAPI="Cometapi",t.COMPACTIFAI="Compactifai",t.Cursor="Cursor",t.Dashscope="Dashscope",t.Databricks="Databricks (Qwen API)",t.DATAROBOT="Datarobot",t.DeepInfra="DeepInfra",t.Deepgram="Deepgram",t.Deepseek="Deepseek",t.DOCKER_MODEL_RUNNER="Docker Model Runner",t.DOTPROMPT="Dotprompt",t.ElevenLabs="ElevenLabs",t.EMPOWER="Empower",t.FalAI="Fal AI",t.FEATHERLESS_AI="Featherless Ai",t.FireworksAI="Fireworks AI",t.FRIENDLIAI="Friendliai",t.GALADRIEL="Galadriel",t.GITHUB_COPILOT="Github Copilot",t.Google_AI_Studio="Google AI Studio",t.GradientAI="GradientAI",t.Groq="Groq",t.HEROKU="Heroku",t.Hosted_Vllm="vllm",t.HUGGINGFACE="Huggingface",t.HYPERBOLIC="Hyperbolic",t.Infinity="Infinity",t.JinaAI="Jina AI",t.LAMBDA_AI="Lambda Ai",t.LEMONADE="Lemonade",t.LLAMAFILE="Llamafile",t.LM_STUDIO="Lm Studio",t.LLAMA="Meta Llama",t.MARITALK="Maritalk",t.MiniMax="MiniMax",t.MistralAI="Mistral AI",t.MOONSHOT="Moonshot",t.MORPH="Morph",t.NEBIUS="Nebius",t.NLP_CLOUD="Nlp Cloud",t.NOVITA="Novita",t.NSCALE="Nscale",t.NVIDIA_NIM="Nvidia Nim",t.Ollama="Ollama",t.OLLAMA_CHAT="Ollama Chat",t.OOBABOOGA="Oobabooga",t.OpenAI="OpenAI",t.OPENAI_LIKE="Openai Like",t.OpenAI_Compatible="OpenAI-Compatible Endpoints (Together AI, etc.)",t.OpenAI_Text="OpenAI Text Completion",t.OpenAI_Text_Compatible="OpenAI-Compatible Text Completion Models (Together AI, etc.)",t.Openrouter="Openrouter",t.Oracle="Oracle Cloud Infrastructure (OCI)",t.OVHCLOUD="Ovhcloud",t.Perplexity="Perplexity",t.PETALS="Petals",t.PG_VECTOR="Pg Vector",t.PREDIBASE="Predibase",t.RECRAFT="Recraft",t.REPLICATE="Replicate",t.RunwayML="RunwayML",t.SAGEMAKER_LEGACY="Sagemaker",t.Sambanova="Sambanova",t.SAP="SAP Generative AI Hub",t.Snowflake="Snowflake",t.TEXT_COMPLETION_CODESTRAL="Text-Completion-Codestral",t.TogetherAI="TogetherAI",t.TOPAZ="Topaz",t.Triton="Triton",t.V0="V0",t.VERCEL_AI_GATEWAY="Vercel Ai Gateway",t.Vertex_AI="Vertex AI (Anthropic, Gemini, etc.)",t.VERTEX_AI_BETA="Vertex Ai Beta",t.VLLM="Vllm",t.VolcEngine="VolcEngine",t.Voyage="Voyage AI",t.WANDB="Wandb",t.WATSONX="Watsonx",t.WATSONX_TEXT="Watsonx Text",t.xAI="xAI",t.XINFERENCE="Xinference",t);let s={A2A_Agent:"a2a_agent",AI21:"ai21",AI21_CHAT:"ai21_chat",AIML:"aiml",AIOHTTP_OPENAI:"aiohttp_openai",Anthropic:"anthropic",ANTHROPIC_TEXT:"anthropic_text",AssemblyAI:"assemblyai",AUTO_ROUTER:"auto_router",Azure:"azure",Azure_AI_Studio:"azure_ai",AZURE_TEXT:"azure_text",BASETEN:"baseten",Bedrock:"bedrock",BedrockMantle:"bedrock_mantle",BYTEZ:"bytez",Cerebras:"cerebras",CLARIFAI:"clarifai",CLOUDFLARE:"cloudflare",CODESTRAL:"codestral",Cohere:"cohere",COHERE_CHAT:"cohere_chat",COMETAPI:"cometapi",COMPACTIFAI:"compactifai",Cursor:"cursor",Dashscope:"dashscope",Databricks:"databricks",DATAROBOT:"datarobot",DeepInfra:"deepinfra",Deepgram:"deepgram",Deepseek:"deepseek",DOCKER_MODEL_RUNNER:"docker_model_runner",DOTPROMPT:"dotprompt",ElevenLabs:"elevenlabs",EMPOWER:"empower",FalAI:"fal_ai",FEATHERLESS_AI:"featherless_ai",FireworksAI:"fireworks_ai",FRIENDLIAI:"friendliai",GALADRIEL:"galadriel",GITHUB_COPILOT:"github_copilot",Google_AI_Studio:"gemini",GradientAI:"gradient_ai",Groq:"groq",HEROKU:"heroku",Hosted_Vllm:"hosted_vllm",HUGGINGFACE:"huggingface",HYPERBOLIC:"hyperbolic",Infinity:"infinity",JinaAI:"jina_ai",LAMBDA_AI:"lambda_ai",LEMONADE:"lemonade",LLAMAFILE:"llamafile",LLAMA:"meta_llama",LM_STUDIO:"lm_studio",MARITALK:"maritalk",MiniMax:"minimax",MistralAI:"mistral",MOONSHOT:"moonshot",MORPH:"morph",NEBIUS:"nebius",NLP_CLOUD:"nlp_cloud",NOVITA:"novita",NSCALE:"nscale",NVIDIA_NIM:"nvidia_nim",Ollama:"ollama",OLLAMA_CHAT:"ollama_chat",OOBABOOGA:"oobabooga",OpenAI:"openai",OPENAI_LIKE:"openai_like",OpenAI_Compatible:"openai",OpenAI_Text:"text-completion-openai",OpenAI_Text_Compatible:"text-completion-openai",Openrouter:"openrouter",Oracle:"oci",OVHCLOUD:"ovhcloud",Perplexity:"perplexity",PETALS:"petals",PG_VECTOR:"pg_vector",PREDIBASE:"predibase",RECRAFT:"recraft",REPLICATE:"replicate",RunwayML:"runwayml",SAGEMAKER_LEGACY:"sagemaker",SageMaker:"sagemaker_chat",Sambanova:"sambanova",SAP:"sap",Snowflake:"snowflake",TEXT_COMPLETION_CODESTRAL:"text-completion-codestral",TogetherAI:"together_ai",TOPAZ:"topaz",Triton:"triton",V0:"v0",VERCEL_AI_GATEWAY:"vercel_ai_gateway",Vertex_AI:"vertex_ai",VERTEX_AI_BETA:"vertex_ai_beta",VLLM:"vllm",VolcEngine:"volcengine",Voyage:"voyage",WANDB:"wandb",WATSONX:"watsonx",WATSONX_TEXT:"watsonx_text",xAI:"xai",XINFERENCE:"xinference"},r="../ui/assets/logos/",i={"A2A Agent":`${r}a2a_agent.png`,Ai21:`${r}ai21.svg`,"Ai21 Chat":`${r}ai21.svg`,"AI/ML API":`${r}aiml_api.svg`,"Aiohttp Openai":`${r}openai_small.svg`,Anthropic:`${r}anthropic.svg`,"Anthropic Text":`${r}anthropic.svg`,AssemblyAI:`${r}assemblyai_small.png`,Azure:`${r}microsoft_azure.svg`,"Azure AI Foundry (Studio)":`${r}microsoft_azure.svg`,"Azure Text":`${r}microsoft_azure.svg`,Baseten:`${r}baseten.svg`,"Amazon Bedrock":`${r}bedrock.svg`,"Amazon Bedrock Mantle":`${r}bedrock.svg`,"AWS SageMaker":`${r}bedrock.svg`,Cerebras:`${r}cerebras.svg`,Cloudflare:`${r}cloudflare.svg`,Codestral:`${r}mistral.svg`,Cohere:`${r}cohere.svg`,"Cohere Chat":`${r}cohere.svg`,Cometapi:`${r}cometapi.svg`,Cursor:`${r}cursor.svg`,"Databricks (Qwen API)":`${r}databricks.svg`,Dashscope:`${r}dashscope.svg`,Deepseek:`${r}deepseek.svg`,Deepgram:`${r}deepgram.png`,DeepInfra:`${r}deepinfra.png`,ElevenLabs:`${r}elevenlabs.png`,"Fal AI":`${r}fal_ai.jpg`,"Featherless Ai":`${r}featherless.svg`,"Fireworks AI":`${r}fireworks.svg`,Friendliai:`${r}friendli.svg`,"Github Copilot":`${r}github_copilot.svg`,"Google AI Studio":`${r}google.svg`,GradientAI:`${r}gradientai.svg`,Groq:`${r}groq.svg`,vllm:`${r}vllm.png`,Huggingface:`${r}huggingface.svg`,Hyperbolic:`${r}hyperbolic.svg`,Infinity:`${r}infinity.png`,"Jina AI":`${r}jina.png`,"Lambda Ai":`${r}lambda.svg`,"Lm Studio":`${r}lmstudio.svg`,"Meta Llama":`${r}meta_llama.svg`,MiniMax:`${r}minimax.svg`,"Mistral AI":`${r}mistral.svg`,Moonshot:`${r}moonshot.svg`,Morph:`${r}morph.svg`,Nebius:`${r}nebius.svg`,Novita:`${r}novita.svg`,"Nvidia Nim":`${r}nvidia_nim.svg`,Ollama:`${r}ollama.svg`,"Ollama Chat":`${r}ollama.svg`,Oobabooga:`${r}openai_small.svg`,OpenAI:`${r}openai_small.svg`,"Openai Like":`${r}openai_small.svg`,"OpenAI Text Completion":`${r}openai_small.svg`,"OpenAI-Compatible Text Completion Models (Together AI, etc.)":`${r}openai_small.svg`,"OpenAI-Compatible Endpoints (Together AI, etc.)":`${r}openai_small.svg`,Openrouter:`${r}openrouter.svg`,"Oracle Cloud Infrastructure (OCI)":`${r}oracle.svg`,Perplexity:`${r}perplexity-ai.svg`,Recraft:`${r}recraft.svg`,Replicate:`${r}replicate.svg`,RunwayML:`${r}runwayml.png`,Sagemaker:`${r}bedrock.svg`,Sambanova:`${r}sambanova.svg`,"SAP Generative AI Hub":`${r}sap.png`,Snowflake:`${r}snowflake.svg`,"Text-Completion-Codestral":`${r}mistral.svg`,TogetherAI:`${r}togetherai.svg`,Topaz:`${r}topaz.svg`,Triton:`${r}nvidia_triton.png`,V0:`${r}v0.svg`,"Vercel Ai Gateway":`${r}vercel.svg`,"Vertex AI (Anthropic, Gemini, etc.)":`${r}google.svg`,"Vertex Ai Beta":`${r}google.svg`,Vllm:`${r}vllm.png`,VolcEngine:`${r}volcengine.png`,"Voyage AI":`${r}voyage.webp`,Watsonx:`${r}watsonx.svg`,"Watsonx Text":`${r}watsonx.svg`,xAI:`${r}xai.svg`,Xinference:`${r}xinference.svg`};e.s(["Providers",()=>a,"getPlaceholder",0,e=>{if("AI/ML API"===e)return"aiml/flux-pro/v1.1";if("Vertex AI (Anthropic, Gemini, etc.)"===e)return"gemini-pro";if("Anthropic"==e)return"claude-3-opus";if("Amazon Bedrock"==e)return"claude-3-opus";if("AWS SageMaker"==e)return"sagemaker/jumpstart-dft-meta-textgeneration-llama-2-7b";else if("Google AI Studio"==e)return"gemini-pro";else if("Azure AI Foundry (Studio)"==e)return"azure_ai/command-r-plus";else if("Azure"==e)return"my-deployment";else if("Oracle Cloud Infrastructure (OCI)"==e)return"oci/xai.grok-4";else if("Snowflake"==e)return"snowflake/mistral-7b";else if("Voyage AI"==e)return"voyage/";else if("Jina AI"==e)return"jina_ai/";else if("VolcEngine"==e)return"volcengine/<any-model-on-volcengine>";else if("DeepInfra"==e)return"deepinfra/<any-model-on-deepinfra>";else if("Fal AI"==e)return"fal_ai/fal-ai/flux-pro/v1.1-ultra";else if("RunwayML"==e)return"runwayml/gen4_turbo";else if("Watsonx"===e)return"watsonx/ibm/granite-3-3-8b-instruct";else if("Cursor"===e)return"cursor/claude-4-sonnet";else return"gpt-3.5-turbo"},"getProviderLogoAndName",0,e=>{if(!e)return{logo:"",displayName:"-"};if("gemini"===e.toLowerCase()){let e="Google AI Studio";return{logo:i[e],displayName:e}}let t=Object.keys(s).find(t=>s[t].toLowerCase()===e.toLowerCase());if(!t)return{logo:"",displayName:e};let r=a[t];return{logo:i[r],displayName:r}},"getProviderModels",0,(e,t)=>{console.log(`Provider key: ${e}`);let a=s[e];console.log(`Provider mapped to: ${a}`);let r=[];return e&&"object"==typeof t&&(Object.entries(t).forEach(([e,t])=>{if(null!==t&&"object"==typeof t&&"litellm_provider"in t){let s=t.litellm_provider;(s===a||"string"==typeof s&&s.includes(a))&&r.push(e)}}),"Cohere"==e&&(console.log("Adding cohere chat models"),Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"cohere_chat"===t.litellm_provider&&r.push(e)})),"AWS SageMaker"==e&&(console.log("Adding sagemaker chat models"),Object.entries(t).forEach(([e,t])=>{null!==t&&"object"==typeof t&&"litellm_provider"in t&&"sagemaker_chat"===t.litellm_provider&&r.push(e)}))),r},"providerLogoMap",0,i,"provider_map",0,s])},798496,e=>{"use strict";var t=e.i(843476),a=e.i(152990),s=e.i(682830),r=e.i(271645),i=e.i(269200),l=e.i(427612),n=e.i(64848),o=e.i(942232),c=e.i(496020),d=e.i(977572),m=e.i(94629),p=e.i(360820),u=e.i(871943);e.i(785269);var g=e.i(322831);function x({data:e=[],columns:x,isLoading:h=!1,defaultSorting:_=[],pagination:f,onPaginationChange:b,enablePagination:v=!1,onRowClick:j}){let[y,A]=r.default.useState(_),[N]=r.default.useState("onChange"),[T,C]=r.default.useState({}),[S,I]=r.default.useState({}),w=(0,a.useReactTable)({data:e,columns:x,state:{sorting:y,columnSizing:T,columnVisibility:S,...v&&f?{pagination:f}:{}},columnResizeMode:N,onSortingChange:A,onColumnSizingChange:C,onColumnVisibilityChange:I,...v&&b?{onPaginationChange:b}:{},getCoreRowModel:(0,s.getCoreRowModel)(),getSortedRowModel:(0,s.getSortedRowModel)(),...v?{getPaginationRowModel:(0,s.getPaginationRowModel)()}:{},enableSorting:!0,enableColumnResizing:!0,defaultColumn:{minSize:40,maxSize:500}}),{t:E}=(0,g.useTranslation)();return(0,t.jsx)("div",{className:"rounded-lg custom-border relative",children:(0,t.jsx)("div",{className:"overflow-x-auto",children:(0,t.jsx)("div",{className:"relative min-w-full",children:(0,t.jsxs)(i.Table,{className:"[&_td]:py-2 [&_th]:py-2",style:{width:w.getTotalSize(),minWidth:"100%",tableLayout:"fixed"},children:[(0,t.jsx)(l.TableHead,{children:w.getHeaderGroups().map(e=>(0,t.jsx)(c.TableRow,{children:e.headers.map(e=>(0,t.jsxs)(n.TableHeaderCell,{className:`py-1 h-8 relative ${"actions"===e.id?"sticky right-0 bg-white shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.1)] w-[120px] ml-8":""} ${e.column.columnDef.meta?.className||""}`,style:{width:"actions"===e.id?120:e.getSize(),position:"actions"===e.id?"sticky":"relative",right:"actions"===e.id?0:"auto"},onClick:e.column.getCanSort()?e.column.getToggleSortingHandler():void 0,children:[(0,t.jsxs)("div",{className:"flex items-center justify-between gap-2",children:[(0,t.jsx)("div",{className:"flex items-center",children:e.isPlaceholder?null:(0,a.flexRender)(e.column.columnDef.header,e.getContext())}),"actions"!==e.id&&e.column.getCanSort()&&(0,t.jsx)("div",{className:"w-4",children:e.column.getIsSorted()?({asc:(0,t.jsx)(p.ChevronUpIcon,{className:"h-4 w-4 text-blue-500"}),desc:(0,t.jsx)(u.ChevronDownIcon,{className:"h-4 w-4 text-blue-500"})})[e.column.getIsSorted()]:(0,t.jsx)(m.SwitchVerticalIcon,{className:"h-4 w-4 text-gray-400"})})]}),e.column.getCanResize()&&(0,t.jsx)("div",{onMouseDown:e.getResizeHandler(),onTouchStart:e.getResizeHandler(),className:`absolute right-0 top-0 h-full w-2 cursor-col-resize select-none touch-none ${e.column.getIsResizing()?"bg-blue-500":"hover:bg-blue-200"}`})]},e.id))},e.id))}),(0,t.jsx)(o.TableBody,{children:h?(0,t.jsx)(c.TableRow,{children:(0,t.jsx)(d.TableCell,{colSpan:x.length,className:"h-8 text-center",children:(0,t.jsx)("div",{className:"text-center text-gray-500",children:(0,t.jsx)("p",{children:E("Zagruzka_modeley")})})})}):w.getRowModel().rows.length>0?w.getRowModel().rows.map(e=>(0,t.jsx)(c.TableRow,{onClick:()=>j?.(e.original),className:j?"cursor-pointer hover:bg-gray-50":"",children:e.getVisibleCells().map(e=>(0,t.jsx)(d.TableCell,{className:`py-0.5 overflow-hidden ${"actions"===e.column.id?"sticky right-0 bg-white shadow-[-4px_0_8px_-6px_rgba(0,0,0,0.1)] w-[120px] ml-8":""} ${e.column.columnDef.meta?.className||""}`,style:{width:"actions"===e.column.id?120:e.column.getSize(),position:"actions"===e.column.id?"sticky":"relative",right:"actions"===e.column.id?0:"auto"},children:(0,a.flexRender)(e.column.columnDef.cell,e.getContext())},e.id))},e.id)):(0,t.jsx)(c.TableRow,{children:(0,t.jsx)(d.TableCell,{colSpan:x.length,className:"h-8 text-center",children:(0,t.jsx)("div",{className:"text-center text-gray-500",children:(0,t.jsx)("p",{children:E("Modeli_ne_naydeny")})})})})})]})})})})}e.s(["ModelDataTable",()=>x])},976883,174886,e=>{"use strict";var t=e.i(843476),a=e.i(275144),s=e.i(434626),r=e.i(271645);let i=r.forwardRef(function(e,t){return r.createElement("svg",Object.assign({xmlns:"http://www.w3.org/2000/svg",fill:"none",viewBox:"0 0 24 24",strokeWidth:2,stroke:"currentColor","aria-hidden":"true",ref:t},e),r.createElement("path",{strokeLinecap:"round",strokeLinejoin:"round",d:"M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"}))});var l=e.i(994388),n=e.i(304967),o=e.i(599724),c=e.i(629569),d=e.i(212931),m=e.i(199133),p=e.i(653496),u=e.i(262218),g=e.i(592968),x=e.i(991124);e.s(["Copy",()=>x.default],174886);var x=x,h=e.i(879664),h=h,_=e.i(798496),f=e.i(727749),b=e.i(402874),v=e.i(764205),j=e.i(190272),y=e.i(785913),A=e.i(916925);e.i(785269);var N=e.i(322831);let{TabPane:T}=p.Tabs;e.s(["default",0,({accessToken:e,isEmbedded:C=!1})=>{let S,I,w,E,O,M,k,{t:L}=(0,N.useTranslation)(),[R,P]=(0,r.useState)(null),[$,D]=(0,r.useState)(null),[z,H]=(0,r.useState)(null),[G,F]=(0,r.useState)("LiteLLM Gateway"),[U,B]=(0,r.useState)(null),[V,K]=(0,r.useState)(""),[W,X]=(0,r.useState)({}),[q,Y]=(0,r.useState)(!0),[J,Z]=(0,r.useState)(!0),[Q,ee]=(0,r.useState)(!0),[et,ea]=(0,r.useState)(""),[es,er]=(0,r.useState)(""),[ei,el]=(0,r.useState)(""),[en,eo]=(0,r.useState)([]),[ec,ed]=(0,r.useState)([]),[em,ep]=(0,r.useState)([]),[eu,eg]=(0,r.useState)([]),[ex,eh]=(0,r.useState)([]),[e_,ef]=(0,r.useState)("I'm alive! ✓"),[eb,ev]=(0,r.useState)(!1),[ej,ey]=(0,r.useState)(!1),[eA,eN]=(0,r.useState)(!1),[eT,eC]=(0,r.useState)(null),[eS,eI]=(0,r.useState)(null),[ew,eE]=(0,r.useState)(null),[eO,eM]=(0,r.useState)({}),[ek,eL]=(0,r.useState)("models");(0,r.useEffect)(()=>{(async()=>{try{await (0,v.getUiConfig)()}catch(e){console.error("Failed to get UI config:",e)}let e=async()=>{try{Y(!0);let e=await (0,v.modelHubPublicModelsCall)();console.log("ModelHubData:",e),P(Array.isArray(e)?e:[])}catch(e){console.error("There was an error fetching the public model data",e),ef("Service unavailable")}finally{Y(!1)}},t=async()=>{try{Z(!0);let e=await (0,v.agentHubPublicModelsCall)();console.log("AgentHubData:",e),D(Array.isArray(e)?e:[])}catch(e){console.error("There was an error fetching the public agent data",e)}finally{Z(!1)}},a=async()=>{try{ee(!0);let e=await (0,v.mcpHubPublicServersCall)();console.log("MCPHubData:",e),H(Array.isArray(e)?e:[])}catch(e){console.error("There was an error fetching the public MCP server data",e)}finally{ee(!1)}};(async()=>{let e=await (0,v.getPublicModelHubInfo)();console.log("Public Model Hub Info:",e),F(e.docs_title),B(e.custom_docs_description),K(e.litellm_version),X(e.useful_links||{})})(),e(),t(),a()})()},[]),(0,r.useEffect)(()=>{},[et,en,ec,em]);let eR=(0,r.useMemo)(()=>{if(!R||!Array.isArray(R))return[];let e=R;if(et.trim()){let t=et.toLowerCase(),a=t.split(/\s+/),s=R.filter(e=>{let s=e.model_group.toLowerCase();return!!s.includes(t)||a.every(e=>s.includes(e))});s.length>0&&(e=s.sort((e,a)=>{let s=e.model_group.toLowerCase(),r=a.model_group.toLowerCase(),i=1e3*(s===t),l=1e3*(r===t),n=100*!!s.startsWith(t),o=100*!!r.startsWith(t),c=50*!!t.split(/\s+/).every(e=>s.includes(e)),d=50*!!t.split(/\s+/).every(e=>r.includes(e)),m=s.length;return l+o+d+(1e3-r.length)-(i+n+c+(1e3-m))}))}return e.filter(e=>{let t=0===en.length||en.some(t=>e.providers.includes(t)),a=0===ec.length||ec.includes(e.mode||""),s=0===em.length||Object.entries(e).filter(([e,t])=>e.startsWith("supports_")&&!0===t).some(([e])=>{let t=e.replace(/^supports_/,"").split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ");return em.includes(t)});return t&&a&&s})},[R,et,en,ec,em]),eP=(0,r.useMemo)(()=>{if(!$||!Array.isArray($))return[];let e=$;if(es.trim()){let t=es.toLowerCase(),a=t.split(/\s+/);e=(e=$.filter(e=>{let s=e.name.toLowerCase(),r=e.description.toLowerCase();return!!(s.includes(t)||r.includes(t))||a.every(e=>s.includes(e)||r.includes(e))})).sort((e,a)=>{let s=e.name.toLowerCase(),r=a.name.toLowerCase(),i=1e3*(s===t),l=1e3*(r===t),n=100*!!s.startsWith(t),o=100*!!r.startsWith(t),c=i+n+(1e3-s.length);return l+o+(1e3-r.length)-c})}return e.filter(e=>0===eu.length||e.skills?.some(e=>e.tags?.some(e=>eu.includes(e))))},[$,es,eu]),e$=(0,r.useMemo)(()=>{if(!z||!Array.isArray(z))return[];let e=z;if(ei.trim()){let t=ei.toLowerCase(),a=t.split(/\s+/);e=(e=z.filter(e=>{let s=e.server_name.toLowerCase(),r=(e.mcp_info?.description||"").toLowerCase();return!!(s.includes(t)||r.includes(t))||a.every(e=>s.includes(e)||r.includes(e))})).sort((e,a)=>{let s=e.server_name.toLowerCase(),r=a.server_name.toLowerCase(),i=1e3*(s===t),l=1e3*(r===t),n=100*!!s.startsWith(t),o=100*!!r.startsWith(t),c=i+n+(1e3-s.length);return l+o+(1e3-r.length)-c})}return e.filter(e=>0===ex.length||ex.includes(e.transport))},[z,ei,ex]),eD=e=>{navigator.clipboard.writeText(e),f.default.success("Copied to clipboard!")},ez=e=>e.replace(/^supports_/,"").split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" "),eH=e=>`$${(1e6*e).toFixed(4)}`,eG=e=>e?e>=1e3?`${(e/1e3).toFixed(0)}K`:e.toString():"N/A";return(0,t.jsx)(a.ThemeProvider,{accessToken:e,children:(0,t.jsxs)("div",{className:C?"w-full":"min-h-screen bg-white",children:[!C&&(0,t.jsx)(b.default,{userID:null,userEmail:null,userRole:null,premiumUser:!1,setProxySettings:eM,proxySettings:eO,accessToken:e||null,isPublicPage:!0,isDarkMode:!1,toggleDarkMode:()=>{}}),(0,t.jsxs)("div",{className:C?"w-full p-6":"w-full px-8 py-12",children:[C&&(0,t.jsx)("div",{className:"mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg",children:(0,t.jsx)("p",{className:"text-sm text-gray-700",children:"These are models, agents, and MCP servers your proxy admin has indicated are available in your company."})}),!C&&(0,t.jsxs)(n.Card,{className:"mb-10 p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:[(0,t.jsx)(c.Title,{className:"text-2xl font-semibold mb-6 text-gray-900",children:L("About")}),(0,t.jsx)("p",{className:"text-gray-700 mb-6 text-base leading-relaxed",children:U||"Proxy Server to call 100+ LLMs in the OpenAI format."}),(0,t.jsx)("div",{className:"flex items-center space-x-3 text-sm text-gray-600",children:(0,t.jsxs)("span",{className:"flex items-center",children:[(0,t.jsx)("span",{className:"w-4 h-4 mr-2",children:"🔧"}),"Built with litellm: v",V]})})]}),W&&Object.keys(W).length>0&&(0,t.jsxs)(n.Card,{className:"mb-10 p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:[(0,t.jsx)(c.Title,{className:"text-2xl font-semibold mb-6 text-gray-900",children:L("Useful_Links")}),(0,t.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6",children:Object.entries(W||{}).map(([e,t])=>({title:e,url:"string"==typeof t?t:t.url,index:"string"==typeof t?0:t.index??0})).sort((e,t)=>e.index-t.index).map(({title:e,url:a})=>(0,t.jsxs)("button",{onClick:()=>window.open(a,"_blank"),className:"flex items-center space-x-3 text-blue-600 hover:text-blue-800 transition-colors p-3 rounded-lg hover:bg-blue-50 border border-gray-200",children:[(0,t.jsx)(s.ExternalLinkIcon,{className:"w-4 h-4"}),(0,t.jsx)(o.Text,{className:"text-sm font-medium",children:e})]},e))})]}),!C&&(0,t.jsxs)(n.Card,{className:"mb-10 p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:[(0,t.jsx)(c.Title,{className:"text-2xl font-semibold mb-6 text-gray-900",children:L("Health_and_Endpoint_Status")}),(0,t.jsx)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6",children:(0,t.jsxs)(o.Text,{className:"text-green-600 font-medium text-sm",children:["Service status: ",e_]})})]}),(0,t.jsx)(n.Card,{className:"p-8 bg-white border border-gray-200 rounded-lg shadow-sm",children:(0,t.jsxs)(p.Tabs,{activeKey:ek,onChange:eL,size:"large",className:"public-hub-tabs",children:[(0,t.jsxs)(T,{tab:"Model Hub",children:[(0,t.jsx)("div",{className:"flex justify-between items-center mb-8",children:(0,t.jsx)(c.Title,{className:"text-2xl font-semibold text-gray-900",children:L("Available_Models")})}),(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"flex items-center space-x-2 mb-3",children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium text-gray-700",children:L("Search_Models")}),(0,t.jsx)(g.Tooltip,{title:"Smart search with relevance ranking - finds models containing your search terms, ranked by relevance. Try searching 'xai grok-4', 'claude-4', 'gpt-4', or 'sonnet'",placement:"top",children:(0,t.jsx)(h.default,{className:"w-4 h-4 text-gray-400 cursor-help"})})]}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)(i,{className:"w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"}),(0,t.jsx)("input",{type:"text",placeholder:"Search model names... (smart search enabled)",value:et,onChange:e=>ea(e.target.value),className:"border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-3 text-gray-700",children:L("Provider_1")}),(0,t.jsx)(m.Select,{mode:"multiple",value:en,onChange:e=>eo(e),placeholder:"Select providers",className:"w-full",size:"large",allowClear:!0,optionRender:e=>{let{logo:a}=(0,A.getProviderLogoAndName)(e.value);return(0,t.jsxs)("div",{className:"flex items-center space-x-2",children:[a&&(0,t.jsx)("img",{src:a,alt:e.label,className:"w-5 h-5 flex-shrink-0 object-contain",onError:e=>{e.target.style.display="none"}}),(0,t.jsx)("span",{className:"capitalize",children:e.label})]})},children:R&&Array.isArray(R)&&(S=new Set,R.forEach(e=>{(e.providers??[]).forEach(e=>S.add(e))}),Array.from(S)).map(e=>(0,t.jsx)(m.Select.Option,{value:e,children:e},e))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-3 text-gray-700",children:L("Mode")}),(0,t.jsx)(m.Select,{mode:"multiple",value:ec,onChange:e=>ed(e),placeholder:"Select modes",className:"w-full",size:"large",allowClear:!0,children:R&&Array.isArray(R)&&(I=new Set,R.forEach(e=>{e.mode&&I.add(e.mode)}),Array.from(I)).map(e=>(0,t.jsx)(m.Select.Option,{value:e,children:e},e))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-3 text-gray-700",children:L("Features")}),(0,t.jsx)(m.Select,{mode:"multiple",value:em,onChange:e=>ep(e),placeholder:"Select features",className:"w-full",size:"large",allowClear:!0,children:R&&Array.isArray(R)&&(w=new Set,R.forEach(e=>{Object.entries(e).filter(([e,t])=>e.startsWith("supports_")&&!0===t).forEach(([e])=>{let t=e.replace(/^supports_/,"").split("_").map(e=>e.charAt(0).toUpperCase()+e.slice(1)).join(" ");w.add(t)})}),Array.from(w).sort()).map(e=>(0,t.jsx)(m.Select.Option,{value:e,children:e},e))})]})]}),(0,t.jsx)(_.ModelDataTable,{columns:[{header:"Model Name",accessorKey:"model_group",enableSorting:!0,cell:({row:e})=>(0,t.jsx)("div",{className:"overflow-hidden",children:(0,t.jsx)(g.Tooltip,{title:e.original.model_group,children:(0,t.jsx)(l.Button,{size:"xs",variant:"light",className:"font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left",onClick:()=>{eC(e.original),ev(!0)},children:e.original.model_group})})}),size:150},{header:"Providers",accessorKey:"providers",enableSorting:!0,cell:({row:e})=>{let a=e.original.providers??[];return(0,t.jsx)("div",{className:"flex flex-wrap gap-1",children:a.map(e=>{let{logo:a}=(0,A.getProviderLogoAndName)(e);return(0,t.jsxs)("div",{className:"flex items-center space-x-1 px-2 py-1 bg-gray-100 rounded text-xs",children:[a&&(0,t.jsx)("img",{src:a,alt:e,className:"w-3 h-3 flex-shrink-0 object-contain",onError:e=>{e.target.style.display="none"}}),(0,t.jsx)("span",{className:"capitalize",children:e})]},e)})})},size:120},{header:"Mode",accessorKey:"mode",enableSorting:!0,cell:({row:e})=>{let a=e.original.mode;return(0,t.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,t.jsx)("span",{children:(e=>{switch(e?.toLowerCase()){case"chat":return"💬";case"rerank":return"🔄";case"embedding":return"📄";default:return"🤖"}})(a||"")}),(0,t.jsx)(o.Text,{children:a||"Chat"})]})},size:100},{header:"Max Input",accessorKey:"max_input_tokens",enableSorting:!0,cell:({row:e})=>(0,t.jsx)(o.Text,{className:"text-center",children:eG(e.original.max_input_tokens)}),size:100,meta:{className:"text-center"}},{header:"Max Output",accessorKey:"max_output_tokens",enableSorting:!0,cell:({row:e})=>(0,t.jsx)(o.Text,{className:"text-center",children:eG(e.original.max_output_tokens)}),size:100,meta:{className:"text-center"}},{header:"Input $/1M",accessorKey:"input_cost_per_token",enableSorting:!0,cell:({row:e})=>{let a=e.original.input_cost_per_token;return(0,t.jsx)(o.Text,{className:"text-center",children:a?eH(a):"Free"})},size:100,meta:{className:"text-center"}},{header:"Output $/1M",accessorKey:"output_cost_per_token",enableSorting:!0,cell:({row:e})=>{let a=e.original.output_cost_per_token;return(0,t.jsx)(o.Text,{className:"text-center",children:a?eH(a):"Free"})},size:100,meta:{className:"text-center"}},{header:"Features",accessorKey:"supports_vision",enableSorting:!1,cell:({row:e})=>{let a=Object.entries(e.original).filter(([e,t])=>e.startsWith("supports_")&&!0===t).map(([e])=>ez(e));return 0===a.length?(0,t.jsx)(o.Text,{className:"text-gray-400",children:"-"}):1===a.length?(0,t.jsx)("div",{className:"h-6 flex items-center",children:(0,t.jsx)(u.Tag,{color:"blue",className:"text-xs",children:a[0]})}):(0,t.jsxs)("div",{className:"h-6 flex items-center space-x-1",children:[(0,t.jsx)(u.Tag,{color:"blue",className:"text-xs",children:a[0]}),(0,t.jsx)(g.Tooltip,{title:(0,t.jsxs)("div",{className:"space-y-1",children:[(0,t.jsx)("div",{className:"font-medium",children:L("All_Features")}),a.map((e,a)=>(0,t.jsxs)("div",{className:"text-xs",children:["• ",e]},a))]}),trigger:"click",placement:"topLeft",children:(0,t.jsxs)("span",{className:"text-xs text-blue-600 cursor-pointer hover:text-blue-800 hover:underline",onClick:e=>e.stopPropagation(),children:["+",a.length-1]})})]})},size:120},{header:"Health Status",accessorKey:"health_status",enableSorting:!0,cell:({row:e})=>{let a=e.original,s="healthy"===a.health_status?"green":"unhealthy"===a.health_status?"red":"default",r=a.health_response_time?`Response Time: ${Number(a.health_response_time).toFixed(2)}ms`:"N/A",i=a.health_checked_at?`Last Checked: ${new Date(a.health_checked_at).toLocaleString()}`:"N/A";return(0,t.jsx)(g.Tooltip,{title:(0,t.jsxs)(t.Fragment,{children:[(0,t.jsx)("div",{children:r}),(0,t.jsx)("div",{children:i})]}),children:(0,t.jsx)(u.Tag,{color:s,children:(0,t.jsx)("span",{className:"capitalize",children:a.health_status??"Unknown"})},a.model_group)})},size:100},{header:"Limits",accessorKey:"rpm",enableSorting:!0,cell:({row:e})=>{var a,s;let r,i=e.original;return(0,t.jsx)(o.Text,{className:"text-xs text-gray-600",children:(a=i.rpm,s=i.tpm,r=[],a&&r.push(`RPM: ${a.toLocaleString()}`),s&&r.push(`TPM: ${s.toLocaleString()}`),r.length>0?r.join(", "):"N/A")})},size:150}],data:eR,isLoading:q,defaultSorting:[{id:"model_group",desc:!1}]}),(0,t.jsx)("div",{className:"mt-8 text-center",children:(0,t.jsxs)(o.Text,{className:"text-sm text-gray-600",children:["Showing ",eR.length," of ",R?.length||0," models"]})})]},"models"),$&&Array.isArray($)&&$.length>0&&(0,t.jsxs)(T,{tab:"Agent Hub",children:[(0,t.jsx)("div",{className:"flex justify-between items-center mb-8",children:(0,t.jsx)(c.Title,{className:"text-2xl font-semibold text-gray-900",children:L("Available_Agents")})}),(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"flex items-center space-x-2 mb-3",children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium text-gray-700",children:L("Search_Agents")}),(0,t.jsx)(g.Tooltip,{title:"Search agents by name or description",placement:"top",children:(0,t.jsx)(h.default,{className:"w-4 h-4 text-gray-400 cursor-help"})})]}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)(i,{className:"w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"}),(0,t.jsx)("input",{type:"text",placeholder:"Search agent names or descriptions...",value:es,onChange:e=>er(e.target.value),className:"border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-3 text-gray-700",children:L("Skills")}),(0,t.jsx)(m.Select,{mode:"multiple",value:eu,onChange:e=>eg(e),placeholder:"Select skills",className:"w-full",size:"large",allowClear:!0,children:$&&Array.isArray($)&&(E=new Set,$.forEach(e=>{e.skills?.forEach(e=>{e.tags?.forEach(e=>E.add(e))})}),Array.from(E).sort()).map(e=>(0,t.jsx)(m.Select.Option,{value:e,children:e},e))})]})]}),(0,t.jsx)(_.ModelDataTable,{columns:[{header:"Agent Name",accessorKey:"name",enableSorting:!0,cell:({row:e})=>(0,t.jsx)("div",{className:"overflow-hidden",children:(0,t.jsx)(g.Tooltip,{title:e.original.name,children:(0,t.jsx)(l.Button,{size:"xs",variant:"light",className:"font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left",onClick:()=>{eI(e.original),ey(!0)},children:e.original.name})})}),size:150},{header:"Description",accessorKey:"description",enableSorting:!1,cell:({row:e})=>{let a=e.original.description??"",s=a.length>80?a.substring(0,80)+"...":a;return(0,t.jsx)(g.Tooltip,{title:a,children:(0,t.jsx)(o.Text,{className:"text-sm text-gray-700",children:s})})},size:250},{header:"Version",accessorKey:"version",enableSorting:!0,cell:({row:e})=>(0,t.jsx)(o.Text,{className:"text-sm",children:e.original.version}),size:80},{header:"Provider",accessorKey:"provider",enableSorting:!1,cell:({row:e})=>{let a=e.original.provider;return a?(0,t.jsx)("div",{className:"text-sm",children:(0,t.jsx)(o.Text,{className:"font-medium",children:a.organization})}):(0,t.jsx)(o.Text,{className:"text-gray-400",children:"-"})},size:120},{header:"Skills",accessorKey:"skills",enableSorting:!1,cell:({row:e})=>{let a=e.original.skills||[];return 0===a.length?(0,t.jsx)(o.Text,{className:"text-gray-400",children:"-"}):1===a.length?(0,t.jsx)("div",{className:"h-6 flex items-center",children:(0,t.jsx)(u.Tag,{color:"purple",className:"text-xs",children:a[0].name})}):(0,t.jsxs)("div",{className:"h-6 flex items-center space-x-1",children:[(0,t.jsx)(u.Tag,{color:"purple",className:"text-xs",children:a[0].name}),(0,t.jsx)(g.Tooltip,{title:(0,t.jsxs)("div",{className:"space-y-1",children:[(0,t.jsx)("div",{className:"font-medium",children:L("All_Skills")}),a.map((e,a)=>(0,t.jsxs)("div",{className:"text-xs",children:["• ",e.name]},a))]}),trigger:"click",placement:"topLeft",children:(0,t.jsxs)("span",{className:"text-xs text-purple-600 cursor-pointer hover:text-purple-800 hover:underline",onClick:e=>e.stopPropagation(),children:["+",a.length-1]})})]})},size:150},{header:"Capabilities",accessorKey:"capabilities",enableSorting:!1,cell:({row:e})=>{let a=Object.entries(e.original.capabilities||{}).filter(([e,t])=>!0===t).map(([e])=>e);return 0===a.length?(0,t.jsx)(o.Text,{className:"text-gray-400",children:"-"}):(0,t.jsx)("div",{className:"flex flex-wrap gap-1",children:a.map(e=>(0,t.jsx)(u.Tag,{color:"green",className:"text-xs capitalize",children:e},e))})},size:150}],data:eP,isLoading:J,defaultSorting:[{id:"name",desc:!1}]}),(0,t.jsx)("div",{className:"mt-8 text-center",children:(0,t.jsxs)(o.Text,{className:"text-sm text-gray-600",children:["Showing ",eP.length," of ",$?.length||0," agents"]})})]},"agents"),z&&Array.isArray(z)&&z.length>0&&(0,t.jsxs)(T,{tab:"MCP Hub",children:[(0,t.jsx)("div",{className:"flex justify-between items-center mb-8",children:(0,t.jsx)(c.Title,{className:"text-2xl font-semibold text-gray-900",children:L("Available_MCP_Servers")})}),(0,t.jsxs)("div",{className:"grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 p-6 bg-gray-50 rounded-lg border border-gray-200",children:[(0,t.jsxs)("div",{children:[(0,t.jsxs)("div",{className:"flex items-center space-x-2 mb-3",children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium text-gray-700",children:L("Search_MCP_Servers")}),(0,t.jsx)(g.Tooltip,{title:"Search MCP servers by name or description",placement:"top",children:(0,t.jsx)(h.default,{className:"w-4 h-4 text-gray-400 cursor-help"})})]}),(0,t.jsxs)("div",{className:"relative",children:[(0,t.jsx)(i,{className:"w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"}),(0,t.jsx)("input",{type:"text",placeholder:"Search MCP server names or descriptions...",value:ei,onChange:e=>el(e.target.value),className:"border border-gray-300 rounded-lg pl-10 pr-4 py-2 w-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white"})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-3 text-gray-700",children:L("Transport")}),(0,t.jsx)(m.Select,{mode:"multiple",value:ex,onChange:e=>eh(e),placeholder:"Select transport types",className:"w-full",size:"large",allowClear:!0,children:z&&Array.isArray(z)&&(O=new Set,z.forEach(e=>{e.transport&&O.add(e.transport)}),Array.from(O).sort()).map(e=>(0,t.jsx)(m.Select.Option,{value:e,children:e},e))})]})]}),(0,t.jsx)(_.ModelDataTable,{columns:[{header:"Server Name",accessorKey:"server_name",enableSorting:!0,cell:({row:e})=>(0,t.jsx)("div",{className:"overflow-hidden",children:(0,t.jsx)(g.Tooltip,{title:e.original.server_name,children:(0,t.jsx)(l.Button,{size:"xs",variant:"light",className:"font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left",onClick:()=>{eE(e.original),eN(!0)},children:e.original.server_name})})}),size:150},{header:"Description",accessorKey:"mcp_info.description",enableSorting:!1,cell:({row:e})=>{let a=String(e.original.mcp_info?.description??"-"),s=a.length>80?a.substring(0,80)+"...":a;return(0,t.jsx)(g.Tooltip,{title:a,children:(0,t.jsx)(o.Text,{className:"text-sm text-gray-700",children:s})})},size:250},{header:"URL",accessorKey:"url",enableSorting:!1,cell:({row:e})=>{let a=e.original.url??"",s=a.length>40?a.substring(0,40)+"...":a;return(0,t.jsx)(g.Tooltip,{title:a,children:(0,t.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,t.jsx)(o.Text,{className:"text-xs font-mono",children:s}),(0,t.jsx)(x.default,{onClick:()=>eD(a),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-3 h-3"})]})})},size:200},{header:"Transport",accessorKey:"transport",enableSorting:!0,cell:({row:e})=>{let a=e.original.transport;return(0,t.jsx)(u.Tag,{color:"blue",className:"text-xs uppercase",children:a})},size:100},{header:"Auth Type",accessorKey:"auth_type",enableSorting:!0,cell:({row:e})=>{let a=e.original.auth_type;return(0,t.jsx)(u.Tag,{color:"none"===a?"gray":"green",className:"text-xs capitalize",children:a})},size:100}],data:e$,isLoading:Q,defaultSorting:[{id:"server_name",desc:!1}]}),(0,t.jsx)("div",{className:"mt-8 text-center",children:(0,t.jsxs)(o.Text,{className:"text-sm text-gray-600",children:["Showing ",e$.length," of ",z?.length||0," MCP servers"]})})]},"mcp")]})})]}),(0,t.jsx)(d.Modal,{title:(0,t.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,t.jsx)("span",{children:eT?.model_group||"Model Details"}),eT&&(0,t.jsx)(g.Tooltip,{title:"Copy model name",children:(0,t.jsx)(x.default,{onClick:()=>eD(eT.model_group),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-4 h-4"})})]}),width:1e3,open:eb,footer:null,onOk:()=>{ev(!1),eC(null)},onCancel:()=>{ev(!1),eC(null)},children:eT&&(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Model_Overview")}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Model_Name_1")}),(0,t.jsx)(o.Text,{children:eT.model_group})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Mode")}),(0,t.jsx)(o.Text,{children:eT.mode||"Not specified"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Providers")}),(0,t.jsx)("div",{className:"flex flex-wrap gap-1 mt-1",children:(eT.providers??[]).map(e=>{let{logo:a}=(0,A.getProviderLogoAndName)(e);return(0,t.jsx)(u.Tag,{color:"blue",children:(0,t.jsxs)("div",{className:"flex items-center space-x-1",children:[a&&(0,t.jsx)("img",{src:a,alt:e,className:"w-3 h-3 flex-shrink-0 object-contain",onError:e=>{e.target.style.display="none"}}),(0,t.jsx)("span",{className:"capitalize",children:e})]})},e)})})]})]}),eT.model_group.includes("*")&&(0,t.jsx)("div",{className:"bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4",children:(0,t.jsxs)("div",{className:"flex items-start space-x-2",children:[(0,t.jsx)(h.default,{className:"w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0"}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium text-blue-900 mb-2",children:L("Wildcard_Routing")}),(0,t.jsxs)(o.Text,{className:"text-sm text-blue-800 mb-2",children:["This model uses wildcard routing. You can pass any value where you see the"," ",(0,t.jsx)("code",{className:"bg-blue-100 px-1 py-0.5 rounded text-xs",children:"*"})," symbol."]}),(0,t.jsxs)(o.Text,{className:"text-sm text-blue-800",children:["For example, with"," ",(0,t.jsx)("code",{className:"bg-blue-100 px-1 py-0.5 rounded text-xs",children:eT.model_group}),", you can use any string (",(0,t.jsx)("code",{className:"bg-blue-100 px-1 py-0.5 rounded text-xs",children:eT.model_group.replaceAll("*","my-custom-value")}),") that matches this pattern."]})]})]})})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Token_Cost_Information")}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Max_Input_Tokens")}),(0,t.jsx)(o.Text,{children:eT.max_input_tokens?.toLocaleString()||"Not specified"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Max_Output_Tokens")}),(0,t.jsx)(o.Text,{children:eT.max_output_tokens?.toLocaleString()||"Not specified"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Input_Cost_per_1M_Tokens")}),(0,t.jsx)(o.Text,{children:eT.input_cost_per_token?eH(eT.input_cost_per_token):"Not specified"})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Output_Cost_per_1M_Tokens")}),(0,t.jsx)(o.Text,{children:eT.output_cost_per_token?eH(eT.output_cost_per_token):"Not specified"})]})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Capabilities")}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:(M=Object.entries(eT).filter(([e,t])=>e.startsWith("supports_")&&!0===t).map(([e])=>e),k=["green","blue","purple","orange","red","yellow"],0===M.length?(0,t.jsx)(o.Text,{className:"text-gray-500",children:L("No_special_capabilities_listed")}):M.map((e,a)=>(0,t.jsx)(u.Tag,{color:k[a%k.length],children:ez(e)},e)))})]}),(eT.tpm||eT.rpm)&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Rate_Limits")}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[eT.tpm&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Tokens_per_Minute")}),(0,t.jsx)(o.Text,{children:eT.tpm.toLocaleString()})]}),eT.rpm&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Requests_per_Minute")}),(0,t.jsx)(o.Text,{children:eT.rpm.toLocaleString()})]})]})]}),eT.supported_openai_params&&eT.supported_openai_params.length>0&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Supported_OpenAI_Parameters")}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:eT.supported_openai_params.map(e=>(0,t.jsx)(u.Tag,{color:"green",children:e},e))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Usage_Example")}),(0,t.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,t.jsx)("pre",{className:"text-sm",children:(0,j.generateCodeSnippet)({apiKeySource:"custom",accessToken:null,apiKey:"your_api_key",inputMessage:"Hello, how are you?",chatHistory:[{role:"user",content:"Hello, how are you?",isImage:!1}],selectedTags:[],selectedVectorStores:[],selectedGuardrails:[],selectedPolicies:[],selectedMCPServers:[],endpointType:(0,y.getEndpointType)(eT.mode||"chat"),selectedModel:eT.model_group,selectedSdk:"openai"})})}),(0,t.jsx)("div",{className:"mt-2 text-right",children:(0,t.jsx)("button",{onClick:()=>{eD((0,j.generateCodeSnippet)({apiKeySource:"custom",accessToken:null,apiKey:"your_api_key",inputMessage:"Hello, how are you?",chatHistory:[{role:"user",content:"Hello, how are you?",isImage:!1}],selectedTags:[],selectedVectorStores:[],selectedGuardrails:[],selectedPolicies:[],selectedMCPServers:[],endpointType:(0,y.getEndpointType)(eT.mode||"chat"),selectedModel:eT.model_group,selectedSdk:"openai"}))},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]})]})}),(0,t.jsx)(d.Modal,{title:(0,t.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,t.jsx)("span",{children:eS?.name||"Agent Details"}),eS&&(0,t.jsx)(g.Tooltip,{title:"Copy agent name",children:(0,t.jsx)(x.default,{onClick:()=>eD(eS.name),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-4 h-4"})})]}),width:1e3,open:ej,footer:null,onOk:()=>{ey(!1),eI(null)},onCancel:()=>{ey(!1),eI(null)},children:eS&&(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Agent_Overview")}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Name")}),(0,t.jsx)(o.Text,{children:eS.name})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Version")}),(0,t.jsx)(o.Text,{children:eS.version})]}),(0,t.jsxs)("div",{className:"col-span-2",children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Description")}),(0,t.jsx)(o.Text,{children:eS.description})]}),eS.url&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("URL")}),(0,t.jsx)("a",{href:eS.url,target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:text-blue-800 text-sm break-all",children:eS.url})]})]})]}),eS.capabilities&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Capabilities")}),(0,t.jsx)("div",{className:"flex flex-wrap gap-2",children:Object.entries(eS.capabilities).filter(([e,t])=>!0===t).map(([e])=>(0,t.jsx)(u.Tag,{color:"green",className:"capitalize",children:e},e))})]}),eS.skills&&eS.skills.length>0&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Skills_1")}),(0,t.jsx)("div",{className:"space-y-4",children:eS.skills.map((e,a)=>(0,t.jsxs)("div",{className:"border border-gray-200 rounded-lg p-4",children:[(0,t.jsx)("div",{className:"flex items-start justify-between mb-2",children:(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium text-base",children:e.name}),(0,t.jsx)(o.Text,{className:"text-sm text-gray-600",children:e.description})]})}),e.tags&&e.tags.length>0&&(0,t.jsx)("div",{className:"flex flex-wrap gap-1 mt-2",children:e.tags.map(e=>(0,t.jsx)(u.Tag,{color:"purple",className:"text-xs",children:e},e))})]},a))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("InputOutput_Modes")}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Input_Modes")}),(0,t.jsx)("div",{className:"flex flex-wrap gap-1 mt-1",children:(eS.defaultInputModes??[]).map(e=>(0,t.jsx)(u.Tag,{color:"blue",children:e},e))})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Output_Modes")}),(0,t.jsx)("div",{className:"flex flex-wrap gap-1 mt-1",children:(eS.defaultOutputModes??[]).map(e=>(0,t.jsx)(u.Tag,{color:"blue",children:e},e))})]})]})]}),eS.documentationUrl&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Documentation")}),(0,t.jsxs)("a",{href:eS.documentationUrl,target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:text-blue-800 flex items-center space-x-2",children:[(0,t.jsx)(s.ExternalLinkIcon,{className:"w-4 h-4"}),(0,t.jsx)("span",{children:L("View_Documentation")})]})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Usage_Example_A2A_Protocol")}),(0,t.jsxs)("div",{className:"mb-4",children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-2 text-gray-700",children:L("Step_1_Retrieve_Agent_Card")}),(0,t.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,t.jsx)("pre",{className:"text-xs",children:`base_url = '${eS.url}'

resolver = A2ACardResolver(
    httpx_client=httpx_client,
    base_url=base_url,
    # agent_card_path uses default, extended_agent_card_path also uses default
)

# Fetch Public Agent Card and Initialize Client
final_agent_card_to_use: AgentCard | None = None
_public_card = (
    await resolver.get_agent_card()
)  # Fetches from default public path - \`/agents/{agent_id}/\`
final_agent_card_to_use = _public_card

if _public_card.supports_authenticated_extended_card:
    try:
        auth_headers_dict = {
            'Authorization': 'Bearer dummy-token-for-extended-card'
        }
        _extended_card = await resolver.get_agent_card(
            relative_card_path=EXTENDED_AGENT_CARD_PATH,
            http_kwargs={'headers': auth_headers_dict},
        )
        final_agent_card_to_use = (
            _extended_card  # Update to use the extended card
        )
    except Exception as e_extended:
        logger.warning(
            f'Failed to fetch extended agent card: {e_extended}. Will proceed with public card.',
            exc_info=True,
        )`})}),(0,t.jsx)("div",{className:"mt-2 text-right",children:(0,t.jsx)("button",{onClick:()=>{eD(`from a2a.client import A2ACardResolver, A2AClient
from a2a.types import (
    AgentCard,
    MessageSendParams,
    SendMessageRequest,
    SendStreamingMessageRequest,
)
from a2a.utils.constants import (
    AGENT_CARD_WELL_KNOWN_PATH,
    EXTENDED_AGENT_CARD_PATH,
)

base_url = '${eS.url}'

resolver = A2ACardResolver(
    httpx_client=httpx_client,
    base_url=base_url,
    # agent_card_path uses default, extended_agent_card_path also uses default
)

# Fetch Public Agent Card and Initialize Client
final_agent_card_to_use: AgentCard | None = None
_public_card = (
    await resolver.get_agent_card()
)  # Fetches from default public path - \`/agents/{agent_id}/\`
final_agent_card_to_use = _public_card

if _public_card.supports_authenticated_extended_card:
    try:
        auth_headers_dict = {
            'Authorization': 'Bearer dummy-token-for-extended-card'
        }
        _extended_card = await resolver.get_agent_card(
            relative_card_path=EXTENDED_AGENT_CARD_PATH,
            http_kwargs={'headers': auth_headers_dict},
        )
        final_agent_card_to_use = (
            _extended_card  # Update to use the extended card
        )
    except Exception as e_extended:
        logger.warning(
            f'Failed to fetch extended agent card: {e_extended}. Will proceed with public card.',
            exc_info=True,
        )`)},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-sm font-medium mb-2 text-gray-700",children:L("Step_2_Call_the_Agent")}),(0,t.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,t.jsx)("pre",{className:"text-xs",children:`client = A2AClient(
    httpx_client=httpx_client, agent_card=final_agent_card_to_use
)

send_message_payload: dict[str, Any] = {
    'message': {
        'role': 'user',
        'parts': [
            {'kind': 'text', 'text': 'how much is 10 USD in INR?'}
        ],
        'messageId': uuid4().hex,
    },
}
request = SendMessageRequest(
    id=str(uuid4()), params=MessageSendParams(**send_message_payload)
)

response = await client.send_message(request)
print(response.model_dump(mode='json', exclude_none=True))`})}),(0,t.jsx)("div",{className:"mt-2 text-right",children:(0,t.jsx)("button",{onClick:()=>{eD(`client = A2AClient(
    httpx_client=httpx_client, agent_card=final_agent_card_to_use
)

send_message_payload: dict[str, Any] = {
    'message': {
        'role': 'user',
        'parts': [
            {'kind': 'text', 'text': 'how much is 10 USD in INR?'}
        ],
        'messageId': uuid4().hex,
    },
}
request = SendMessageRequest(
    id=str(uuid4()), params=MessageSendParams(**send_message_payload)
)

response = await client.send_message(request)
print(response.model_dump(mode='json', exclude_none=True))`)},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]})]})]})}),(0,t.jsx)(d.Modal,{title:(0,t.jsxs)("div",{className:"flex items-center space-x-2",children:[(0,t.jsx)("span",{children:ew?.server_name||"MCP Server Details"}),ew&&(0,t.jsx)(g.Tooltip,{title:"Copy server name",children:(0,t.jsx)(x.default,{onClick:()=>eD(ew.server_name),className:"cursor-pointer text-gray-500 hover:text-blue-500 w-4 h-4"})})]}),width:1e3,open:eA,footer:null,onOk:()=>{eN(!1),eE(null)},onCancel:()=>{eN(!1),eE(null)},children:ew&&(0,t.jsxs)("div",{className:"space-y-6",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Server_Overview")}),(0,t.jsxs)("div",{className:"grid grid-cols-2 gap-4 mb-4",children:[(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Server_Name")}),(0,t.jsx)(o.Text,{children:ew.server_name})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Transport")}),(0,t.jsx)(u.Tag,{color:"blue",children:ew.transport})]}),ew.alias&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Alias")}),(0,t.jsx)(o.Text,{children:ew.alias})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Auth_Type")}),(0,t.jsx)(u.Tag,{color:"none"===ew.auth_type?"gray":"green",children:ew.auth_type})]}),(0,t.jsxs)("div",{className:"col-span-2",children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("Description")}),(0,t.jsx)(o.Text,{children:ew.mcp_info?.description||"-"})]}),(0,t.jsxs)("div",{className:"col-span-2",children:[(0,t.jsx)(o.Text,{className:"font-medium",children:L("URL")}),(0,t.jsxs)("a",{href:ew.url,target:"_blank",rel:"noopener noreferrer",className:"text-blue-600 hover:text-blue-800 text-sm break-all flex items-center space-x-2",children:[(0,t.jsx)("span",{children:ew.url}),(0,t.jsx)(s.ExternalLinkIcon,{className:"w-4 h-4"})]})]})]})]}),ew.mcp_info&&Object.keys(ew.mcp_info).length>0&&(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Additional_Information")}),(0,t.jsx)("div",{className:"bg-gray-50 p-4 rounded-lg",children:(0,t.jsx)("pre",{className:"text-xs overflow-x-auto",children:JSON.stringify(ew.mcp_info,null,2)})})]}),(0,t.jsxs)("div",{children:[(0,t.jsx)(o.Text,{className:"text-lg font-semibold mb-4",children:L("Usage_Example")}),(0,t.jsx)("div",{className:"bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto",children:(0,t.jsx)("pre",{className:"text-sm",children:`# Using MCP Server with Python FastMCP

from fastmcp import Client
import asyncio

# Standard MCP configuration
config = {
    "mcpServers": {
        "${ew.server_name}": {
            "url": "http://localhost:4000/${ew.server_name}/mcp",
            "headers": {
                "x-litellm-api-key": "Bearer sk-1234"
            }
        }
    }
}

# Create a client that connects to the server
client = Client(config)

async def main():
    async with client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {[tool.name for tool in tools]}")

        # Call a tool
        response = await client.call_tool(
            name="tool_name", 
            arguments={"arg": "value"}
        )
        print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())`})}),(0,t.jsx)("div",{className:"mt-2 text-right",children:(0,t.jsx)("button",{onClick:()=>{eD(`# Using MCP Server with Python FastMCP

from fastmcp import Client
import asyncio

# Standard MCP configuration
config = {
    "mcpServers": {
        "${ew.server_name}": {
            "url": "http://localhost:4000/${ew.server_name}/mcp",
            "headers": {
                "x-litellm-api-key": "Bearer sk-1234"
            }
        }
    }
}

# Create a client that connects to the server
client = Client(config)

async def main():
    async with client:
        # List available tools
        tools = await client.list_tools()
        print(f"Available tools: {[tool.name for tool in tools]}")

        # Call a tool
        response = await client.call_tool(
            name="tool_name", 
            arguments={"arg": "value"}
        )
        print(f"Response: {response}")

if __name__ == "__main__":
    asyncio.run(main())`)},className:"text-sm text-blue-600 hover:text-blue-800 cursor-pointer",children:"Copy to clipboard"})})]})]})})]})})}],976883)}]);