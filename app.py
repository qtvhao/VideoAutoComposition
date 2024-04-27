from src.intro import intro
from celery import Celery

app = Celery('video-auto-composition-jobs', broker='amqp://guest@amqp//')

@app.task
def hello():
    print('process task')
    return 'hello world'

# from src.composite.simple import simple_composite
# from src.captions.one_at_a_time import one_word_at_a_time
# CONSTANT
ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

# print Hello World
print("Hello World")

template="Minimalist Line-based Economic News Intro"
template_folder = TEMPLATES_DIR + template + "/"

print("Template Folder: ", template_folder)
# if __name__ == "__main__":
    # print("Hello World")
    # intro(template_folder, ["LET’S TALK", "THIS MONDAY | 3:40 PM", "@Kiến thức Sunday"])
    # compost = simple_composite(ASSETS_DIR + "image/", ASSETS_DIR + "audio/")
    # one_word_at_a_time(ASSETS_DIR + "audio/", compost)


