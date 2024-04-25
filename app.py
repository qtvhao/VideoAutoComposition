import time
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
print(mp4_file)

