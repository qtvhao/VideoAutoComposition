# from src.intro import intro
from src.composite import simple
from src.captions import one_at_a_time
import sys
import json
import random
import os
import shutil

ASSETS_DIR = "/app/assets/"
SRC_DIR = "/app/src/"
TEMPLATES_DIR = "/app/templates/"

logs_file = "/tmp/logs.txt"
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
    jobId = "" + paragraph["jobId"]

    composite_sequences = "/app/storage/images/composite-sequences/"
    if not os.path.exists(composite_sequences):
        os.makedirs(composite_sequences)

    output_file = composite_sequences + "composite-" + engine + "-" + jobId + ".mp4"
    print(f"route: {route}")
    print(f"engine: {engine}")
    print(f"output_file: {output_file}")
    print(f"audio_file: {audio_file}")
    if route == "composite":
        if engine == "simple":
            randomId = random.randbytes(8).hex()
            copied_sanitized_base_directory = f"/tmp/sanitized-{randomId}/"
            copied_audio_file = f"/tmp/audio-{randomId}.mp3"
            tmp_output_file = f"/tmp/composite-{randomId}.mp4"
            tmp_output_file_captioned = f"/tmp/composite-captioned-{randomId}.mp4"
            os.system(f"cp {audio_file} {copied_audio_file}")
            sanitizedFiles = os.listdir(sanitizedBaseDirectory)
            for sanitizedFile in sanitizedFiles:
                if not sanitizedFile.endswith("blur.mp4"):
                    print(f"Copying {sanitizedBaseDirectory + sanitizedFile} to {copied_sanitized_base_directory + sanitizedFile}")
                    shutil.copyfile(sanitizedBaseDirectory + sanitizedFile, copied_sanitized_base_directory + sanitizedFile)
            # os.system(f"cp -r {sanitizedBaseDirectory} {copied_sanitized_base_directory}")

            simple.simple_composite(copied_sanitized_base_directory, copied_audio_file, tmp_output_file)
            one_at_a_time.one_word_at_a_time(subtitle, tmp_output_file, tmp_output_file_captioned)
            shutil.copyfile(tmp_output_file_captioned, output_file)
            print(f"Copied {tmp_output_file_captioned} to {output_file}")
            # clean up
            # . venv/bin/activate; python3 app.py composite /tmp/job-*
            shutil.rmtree(copied_sanitized_base_directory)
            os.remove(copied_audio_file)
            os.remove(tmp_output_file)

            logs = open(logs_file, "r").read()

            returnvalue({
                "logs": logs,
                "composite": "/tmp/composite-" + randomId + ".mp4",
                "caption": output_file
            })
