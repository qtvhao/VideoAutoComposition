import moviepy.editor as moviepy
import os
import json

output_folder = "/app/assets/outputs/"

def one_word_at_a_time(subtitle_dir, video_path):
    # 
    subtitle_json = subtitle_dir + [file for file in os.listdir(subtitle_dir) if file.endswith('.json')][0]
    print(subtitle_json)
    subtitle_json = open(subtitle_json, 'r')
    subtitle = subtitle_json.read()
    subtitle_json.close()
    parsed = json.loads(subtitle)
    clips = [
        moviepy.VideoFileClip(video_path)
    ]
    for line in parsed:
        print(line)
        part = line['part']
        start = line['start'] / 1000
        end = line['end'] / 1000
        # magick -list font
        image_of_styled_text = moviepy.TextClip(part, fontsize=70, color='white', font="DejaVu-Sans-Bold")
        image_of_styled_text = image_of_styled_text.set_position('center')
        image_of_styled_text = image_of_styled_text.set_start(start)
        image_of_styled_text = image_of_styled_text.set_end(end)
        image_of_styled_text = image_of_styled_text.set_duration(end-start)
        print("Start: ", start)
        print("End: ", end)
        image_of_styled_text = image_of_styled_text.set_fps(30)
        clips.append(image_of_styled_text)
    # print(parsed)
    # exit()
    video_clip = moviepy.CompositeVideoClip(clips)
    # video_clip = moviepy.concatenate_videoclips(clips)
    video_clip = video_clip.set_fps(30)
    video_clip.write_videofile(filename=output_folder + "output-one-word-at-a-time.mp4", codec="libx264", audio_codec="aac")
    video_clip.close()
    print("done")
    