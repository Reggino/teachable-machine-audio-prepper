## Prepare Audio for Teachable Machine import

Step 1: Split your audio-sources into 1 second, .webm fragments using ffmpeg. E.g.:

```
for f in *.wav; do ffmpeg -i "$f" -c:a libopus -f segment -segment_time 1 "${f%.wav}_%03d.webm"; done
```

Step 2: Start this app and import .webm files.

Step 3: Import result .zip into https://teachablemachine.withgoogle.com/
