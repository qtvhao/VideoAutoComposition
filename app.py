import json
import os
from src.intro import intro

# CONSTANT
ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

# print Hello World
print("Hello World")

template="Minimalist Line-based Economic News Intro"
template_folder = TEMPLATES_DIR + template + "/"

intro(template_folder, ["LET’S TALK", "THIS MONDAY | 3:40 PM", "@Kiến thức Sunday"])
