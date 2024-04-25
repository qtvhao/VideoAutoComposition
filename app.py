import json
import os

# CONSTANT
ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

# print Hello World
print("Hello World")

template="Minimalist Line-based Economic News Intro"

template_folder = TEMPLATES_DIR + template + "/"
mp4_file = [f for f in os.listdir(template_folder) if f.endswith('.mp4')][0]

texts_config_file = template_folder + "texts.json"
texts = {}
if not os.path.exists(texts_config_file):
    texts = {}
    texts["texts"] = []
    texts["texts"].append({"text": "Hello World", "position": [228.857, 99.2187]})
    with open(texts_config_file, 'w') as outfile:
        json.dump(texts, outfile)
else:
    with open(texts_config_file) as json_file:
        texts = json.load(json_file)
# 

for text in texts["texts"]:
    print(text["text"], text["position"])
