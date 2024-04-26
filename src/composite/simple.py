import moviepy.editor as moviepy
import os

output_folder = "/app/assets/outputs/"
if not os.path.exists(output_folder):
    os.makedirs(output_folder)

def simple_composite(image_dir, audio_dir):
    images_files = [f for f in os.listdir(image_dir) if f.endswith('.mp4')]
    print(images_files)

    audio_file = [f for f in os.listdir(audio_dir) if f.endswith('.mp3')][0]
    print(audio_file)
    
    audio_duration = moviepy.AudioFileClip(audio_dir + audio_file).duration

    print("Duration", audio_duration)
    clips = []
    final_duration = 0
    for image_file in images_files:
        clip = moviepy.VideoFileClip(image_dir + image_file)
        final_duration += clip.duration
        clips.append(clip)
        if final_duration >= audio_duration:
            break

    final_clip = moviepy.concatenate_videoclips(clips)
    final_clip = final_clip.set_audio(moviepy.AudioFileClip(audio_dir + audio_file))
    final_clip.write_videofile(output_folder + "output-concat.mp4", codec="libx264", audio_codec="aac")
    print("Done")
