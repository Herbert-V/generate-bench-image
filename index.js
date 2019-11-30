const fs = require('fs');
const text2png = require('text2png');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const app = express();

const mergeImages = require('merge-images-v2');
const Canvas = require('canvas');

app.use(cors());
app.use(bodyParser.json());

const isNumber = text => typeof parseInt(text, 10) === 'number';
const CORDS_PER_DIGITS = {
	1: { x: 105, y: 101 },
	2: { x: 82, y: 100 }
};
const PADDING_PER_DIGITS = {
	1: { paddingTop: 9, paddingBottom: 6, paddingLeft: 20, paddingRight: 20 },
	2: { padding: 10, paddingLeft: 6, paddingRight: 6 },
};
const DEFAULT_CORDS = { x: 82, y: 100 };
const DEFAULT_PADDING_CONFIG = { padding: 10, paddingLeft: 6, paddingRight: 6 };

app.post('/get-image', (req, res) => {
	const { text } = req.body || {};
	const shouldTransform = isNumber(text);

	if (shouldTransform) {
		const digits = text.length;
		const cords = CORDS_PER_DIGITS[digits] || DEFAULT_CORDS;
		const paddingConfig = PADDING_PER_DIGITS[digits] || DEFAULT_PADDING_CONFIG;
		const numberImg = text2png(text, {
			font: '120px Futura',
			color: 'black',
			backgroundColor: '#2C7575',
			textAlign: 'left',
			...paddingConfig,
		});

		mergeImages([
			{ src: 'static/sign.png', x: 0, y: 0 },
			{ src: numberImg, ...cords },
		], {
			Canvas: Canvas,
		}).then(imageFileData => {
			const result = imageFileData.replace(/^data:image\/png;base64,/, "");

			fs.writeFileSync('static/result.png', result, { encoding: 'base64' });
		}).catch((e) => { console.log(e) });

		res.status(200).send();

		return;
	}

	res.status(404).send('The text sent should be a number')
});

app.listen(3000, () => {
	console.log('Listening in port 3000');
})
