import os
import json
import moviepy.editor as moviepy
import random
def intro(template_folder, placed_texts):
    mp4_file = [f for f in os.listdir(template_folder) if f.endswith('.mp4')][0]

    texts_config_file = template_folder + "texts.json"

    texts = {}
    if not os.path.exists(texts_config_file):
        texts = {}
        texts["texts"] = []
        texts["texts"].append({"text": "LET’S TALK", "position": [228.857, 99.2187], "timeline_cursor": 60 + 20})
        texts["texts"].append({"text": "THIS MONDAY | 3:40 PM", "position": [30.4708, 245.381], "timeline_cursor": 3 * 60 + 2})
        texts["texts"].append({"text": "@Kiến thức Sunday", "position": [127.416, 48.0723], "timeline_cursor": 4 * 60 + 20})
        with open(texts_config_file, 'w') as outfile:
            json.dump(texts, outfile)
    else:
        with open(texts_config_file) as json_file:
            texts = json.load(json_file)
    # 

    for text in texts["texts"]:
        print(text["text"], text["position"], text["timeline_cursor"])
        text_content = text["text"]
        text_position = text["position"]
        timeline_cursor = text["timeline_cursor"]
        # 
        print("text_content", text_content)
        print("text_position", text_position)
        print("timeline_cursor", timeline_cursor)
        # 
        print("mp4_file", mp4_file)
        print("placed_texts", placed_texts)
        # Output /app/assets/outputs/
        output_folder = "/app/assets/outputs/"
        if not os.path.exists(output_folder):
            os.makedirs(output_folder)
        #
        random5 = ''.join(random.choices('0123456789', k=5))
        output_file = output_folder + "output_" + random5 + ".mp4"
        video = moviepy.VideoFileClip(template_folder + mp4_file)
        #
        # Add text
        txt_clip = moviepy.TextClip(text_content, fontsize=70, color='white')
        txt_clip = txt_clip.set_pos(text_position)
        txt_clip = txt_clip.set_duration(video.duration)
        txt_clip = txt_clip.set_start(timeline_cursor)
        video = moviepy.CompositeVideoClip([video, txt_clip])
        video.write_videofile(output_file, codec='libx264')

        print("output_file", output_file)

