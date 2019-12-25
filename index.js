const fs = require("fs");
const text2png = require("text2png");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

const mergeImages = require("merge-images-v2");
const Canvas = require("canvas");
const axios = require("axios");
const FormData = require("form-data");

app.use(cors());
app.use(bodyParser.json());

const isNumber = text => typeof parseInt(text, 10) === "number";
const CORDS_PER_DIGITS = {
  1: { x: 475, y: 67 },
  2: { x: 465, y: 67 }
};
const PADDING_PER_DIGITS = {
  1: { paddingTop: 9, paddingBottom: 6, paddingLeft: 20, paddingRight: 20 },
  2: { padding: 10, paddingLeft: 6, paddingRight: 6 }
};
const DEFAULT_CORDS = { x: 82, y: 100 };
const DEFAULT_PADDING_CONFIG = { padding: 10, paddingLeft: 6, paddingRight: 6 };

const uploadImgAnonymously = base64Img => {
  const form = new FormData();
  form.append("image", base64Img);
  form.append("type", "base64");

  const headers = {
    ...form.getHeaders(),
    "Content-Length": form.getLengthSync(),
    Authorization: `Client-ID ${process.env.CLIENT_ID}`
  };

  return axios.post("https://api.imgur.com/3/upload", form, { headers });
};

app.get("/get-image", async (req, res) => {
  const { days } = req.query || {};
  const shouldTransform = isNumber(days);
  console.log("Getting days", days);

  if (shouldTransform) {
    try {
      const digits = days.length;
      const cords = CORDS_PER_DIGITS[digits] || DEFAULT_CORDS;
      const paddingConfig =
        PADDING_PER_DIGITS[digits] || DEFAULT_PADDING_CONFIG;
      console.log("Creating img from text");
      const numberImg = text2png(days, {
        font: "50px Impact",
        color: "white",
        backgroundColor: "transparent",
        strokeWidth: 2,
        strokeColor: "black",
        textAlign: "left",
        localFontPath: "static/impact.ttf",
        localFontName: "Impact",
        ...paddingConfig
      });
      console.log("Finishing creating img from text");
      console.log("Merging imgs");
      const imageFileData = await mergeImages(
        [
          { src: "static/base_2.png", x: 0, y: 0 },
          { src: numberImg, ...cords }
        ],
        {
          Canvas: Canvas
        }
      );
      console.log("Finishing merging imgs");
      const result = imageFileData.replace(/^data:image\/png;base64,/, "");

      console.log("Uploading to imgur");
      const response = await uploadImgAnonymously(result);
      const {
        data: {
          data: { link }
        }
      } = response;
      console.log("Finishing uploading to imgur");

      res.status(200).send(link);

      return;
    } catch (e) {
      console.log(e);

      res.status(500).send("Server Error");
    }
  }

  res.status(404).send("The days param sent should be a number");
});

app.listen(3000, () => {
  console.log("Listening in port 3000");
});
