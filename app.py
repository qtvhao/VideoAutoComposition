from src.intro import intro
from src.composite.simple import simple_composite

# CONSTANT
ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

# print Hello World
print("Hello World")

template="Minimalist Line-based Economic News Intro"
template_folder = TEMPLATES_DIR + template + "/"

if __name__ == "__main__":
    # intro(template_folder, ["LET’S TALK", "THIS MONDAY | 3:40 PM", "@Kiến thức Sunday"])
    simple_composite(ASSETS_DIR + "image/", ASSETS_DIR + "audio/")

