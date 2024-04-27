from src.intro import intro
from celery import Celery

app = Celery('tasks', broker='amqp://guest@amqp//')

@app.task
def add(x, y):
    print(f'Hello {x} {y}')
    return 'hello world'

# ASSETS_DIR = "/app/assets/"
# SRC_DIR = "/app/src/"
# TEMPLATES_DIR = "/app/templates/"

# template="Minimalist Line-based Economic News Intro"
# template_folder = TEMPLATES_DIR + template + "/"
