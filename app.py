from flask import Flask, send_file

app = Flask(__name__)

@app.route("/get-image")
def get_image():
    # Serve the texture image from the 'static/images' folder
    return send_file("static/images/texture.jpg", mimetype="image/jpeg")

if __name__ == "__main__":
    app.run(debug=True)
