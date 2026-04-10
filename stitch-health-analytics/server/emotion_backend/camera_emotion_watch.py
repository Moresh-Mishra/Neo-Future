import time
import cv2

from emotional_analyzer import analyze_face_from_bytes


def format_emotions(emotions):
    if not emotions:
        return "no face"
    parts = []
    for item in emotions:
        label = item.get("emotion", "unknown")
        pct = item.get("percentage", 0.0)
        score = pct / 100.0
        parts.append(f"{label}: {score:.2f}")
    return ", ".join(parts)


def main():
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("camera error: unable to open camera")
        return

    try:
        while True:
            ok, frame = cap.read()
            if not ok or frame is None:
                print("camera error: unable to read frame")
                time.sleep(3)
                continue

            cv2.imshow("Camera", frame)

            ok, buffer = cv2.imencode(".jpg", frame)
            if not ok:
                print("camera error: encode failed")
                time.sleep(3)
                continue

            emotions, face_count = analyze_face_from_bytes(buffer.tobytes())
            print(format_emotions(emotions))
            if cv2.waitKey(1) & 0xFF == ord('q'):
                break
            time.sleep(3)
    finally:
        cap.release()
        cv2.destroyAllWindows()


if __name__ == "__main__":
    main()
