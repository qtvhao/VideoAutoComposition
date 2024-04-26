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
        #     wrapped_txt,
        #     font=font_path,
        #     fontsize=params.font_size,
        #     color=params.text_fore_color,
        #     bg_color=params.text_background_color,
        #     stroke_color=params.stroke_color,
        #     stroke_width=params.stroke_width,
        #     print_cmd=False,

        text_clip_params = {
            "txt": part,
            "fontsize": 70,
            "color": "white",
            "font": "DejaVu-Sans-Bold",
            "size": (1920, 1080),
            "kerning": 5,
            "method": "caption",
            "align": "center",
            "fps": 30,
            "stroke_color": "black",
            "stroke_width": 2,
        }
        clip_info = {k: text_clip_params[k] for k in ('txt', 'fontsize', 'font', 'color', 'stroke_width', 'stroke_color', 'size', 'kerning', 'method', 'align') if k in text_clip_params}
        image_of_styled_text = moviepy.TextClip(**clip_info)
        # image_of_styled_text = image_of_styled_text.set_position('center')
        image_of_styled_text = image_of_styled_text.set_start(start)
        image_of_styled_text = image_of_styled_text.set_end(end)
        image_of_styled_text = image_of_styled_text.set_duration(end-start)
        # print("Start: ", start)
        # print("End: ", end)
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
    