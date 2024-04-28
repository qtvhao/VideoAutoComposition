# from src.intro import intro
from src.composite import simple
from src.captions import one_at_a_time
import sys
import json
import random

ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

# template="Minimalist Line-based Economic News Intro"
# template_folder = TEMPLATES_DIR + template + "/"
def returnvalue(returnvalue_0):
    returnvalue_json = open("/tmp/returnvalue.json", "w")
    returnvalue_json.write(json.dumps(returnvalue_0))
    returnvalue_json.close()

if __name__ == "__main__":
    # simple()
    argv = sys.argv
    route = argv[1]
    job_json_file = argv[2]
    job_json = open(job_json_file, "r").read()
    job = json.loads(job_json)
    numberthOfParagraph = job["numberthOfParagraph"]
    paragraph = job["videoScript"][numberthOfParagraph]
    subtitle = paragraph["subtitle"]
    sanitizedBaseDirectory = paragraph["sanitizedBaseDirectory"] + "/"
    audio_file = paragraph["audioFilePath"]
    engine = "simple"
    print(f"job: {job}")
    article_id = "" + job["articleId"]
    output_file = "/tmp/composite-" + engine + "-" + article_id + ".mp4"
    print(f"route: {route}")
    print(f"engine: {engine}")
    print(f"output_file: {output_file}")
    print(f"audio_file: {audio_file}")
    if route == "composite":
        if engine == "simple":
            randomId = random.randbytes(8).hex()
            compost = simple.simple_composite(sanitizedBaseDirectory, audio_file, False)
            one_at_a_time.one_word_at_a_time(subtitle, compost, output_file)

            returnvalue({
                "composite": "/tmp/composite-" + randomId + ".mp4",
                "caption": output_file
            })
