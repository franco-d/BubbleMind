PGraphics mainBuffer;
BubbleDrawer bd;

int width = 800;
int height = 555;
int offsetX = 50;
int offsetY = 25;
int bubbleWidth = width - offsetX;
int bubbleHeight = height - offsetY;
float stdStrokeWeight = 0.8;

int loadingSizeX = 220;
int loadingSizeY = 120;
String strLoading = "Loading Data";

interface JavaScript {
	boolean isPlaying;
	boolean init;
	void	mouseMoved();
	void	clickOnPlot();
}

JavaScript js = null;

void bindJavascript(JavaScript jsBind) {
	js = jsBind;
}

BubbleDrawer getBubbleDrawer() {
	return bd;
}

int getBubbleWidth() {
	return bubbleWidth;
}

int getBubbleHeight() {
	return bubbleHeight;
}

void setup() {
	size(width, height);
	frameRate(30);
	mainBuffer = createGraphics(width, height);
	bd = new BubbleDrawer();
	mainBuffer.textFont(createFont("Verdana", 20, true));
	mainBuffer.beginDraw();
	mainBuffer.background(0, 0, 0, 0);
	mainBuffer.textAlign(CENTER, CENTER);
	mainBuffer.ellipseMode(CENTER);
	mainBuffer.stroke(0);
	mainBuffer.smooth(8);
	mainBuffer.strokeWeight(stdStrokeWeight);
	mainBuffer.colorMode(HSB, 360);				// TMP 255
	mainBuffer.ellipseMode(CENTER);
	bd.clear();
	noLoop();
}

void draw() {
	mainBuffer.endDraw();
	image(mainBuffer, 0, 0);
	mainBuffer.beginDraw();
}

// Refresh the page even if processing have the focus
void	keyPressed() {
	if (keyCode == 116) {
		window.location.reload();
	}
}

int getMouseX() {
	return mouseX - offsetX;
}
  
int getMouseY() {
	return mouseY;
}

void mouseMoved() {
	if (init && !js.isPlaying) {
		js.mouveMove();
	}
}

void mouseClicked() {
  if (mouseButton == LEFT)
	js.clickOnPlot();
}

class    BubbleDrawer {
  private int 	_defaultAlphaValue = 360;
  private int 	_interfaceAlphaValue = 150;
  private int 	_alphaValue = 360;
  private int	_defaultSaturation = 360;
  private int	_whiteSaturation = 0;
  private int	_defaultBrightness = 360;
  private int 	_defaultColor = 200;
  private boolean	_useColor = true;
  private int 	_interfaceSizeValue = 20;
  private int 	_defaultSize = 20;
  private boolean	_useSize = true;

  BubbleDrawer() {
  }

  void drawBubble(int posX, int posY, int size, int col, boolean clicked, boolean crossed) {
  	this._useSize ? size : size = this._interfaceSizeValue;
  	if (clicked) {
  		mainBuffer.stroke(0, 0, 0, this._defaultAlphaValue);
  		mainBuffer.fill(this._useColor ? col : this._defaultColor, this._defaultSaturation, this._defaultBrightness, this._defaultAlphaValue);
  	}
  	else {
      	mainBuffer.stroke(0, 0, 0, this._alphaValue);
      	mainBuffer.fill(this._useColor ? col : this._defaultColor, this._defaultSaturation, this._defaultBrightness, this._alphaValue);
    }
    mainBuffer.ellipse(posX + offsetX, posY, size, size);
    if (crossed)
  		mainBuffer.line(posX + offsetX + size / 3, posY - size / 3, posX + offsetX - size / 3, posY + size / 3);
  }

  void  drawHighlightBubble(int posX, int posY, int size, int col, boolean crossed) {
  	this._useSize ? size : size = this._defaultSize;
    mainBuffer.fill(this._useColor ? col : this._defaultColor, this._defaultSaturation, this._defaultBrightness, this._defaultAlphaValue);
    mainBuffer.ellipse(posX + offsetX, posY, size, size);
    mainBuffer.strokeWeight(5);
    mainBuffer.stroke(this._useColor ? col : this._defaultColor, this._defaultSaturation, this._defaultBrightness, 100);
    mainBuffer.noFill();
    mainBuffer.ellipse(posX + offsetX, posY, size + 12, size + 12);
    mainBuffer.strokeWeight(stdStrokeWeight);
    mainBuffer.stroke(0);
    if (crossed)
  		mainBuffer.line(posX + offsetX + size / 3, posY - size / 3, posX + offsetX - size / 3, posY + size / 3);
  }

  void  drawDate(int date) {
  	// CENTERED
    /*mainBuffer.textSize(height * 30 / 100);
    String year = str(date);
    float yearWidth = (width + offsetX) / 2;
    float yearHeight = bubbleHeight / 2;
    mainBuffer.fill(180);
    mainBuffer.text(year, yearWidth, yearHeight);*/
    
    // BOTTOM RIGHT
    mainBuffer.textSize(height * 20 / 100);
    String year = str(date);
    float yearWidth = width - mainBuffer.textWidth(year) / 2;
    float yearHeight = height + offsetY - mainBuffer.textAscent() - mainBuffer.textDescent();
    mainBuffer.fill(250);
    mainBuffer.text(year, yearWidth, yearHeight);
  }

  void  drawBubbleName(int posX, int posY, int size, int col, String name) {
  	this._useSize ? size : size = this._defaultSize;
    mainBuffer.strokeWeight(2);
    mainBuffer.stroke(this._useColor ? col : this._defaultColor, this._defaultSaturation, this._defaultBrightness, this._defaultAlphaValue);
    mainBuffer.textSize(11);
    mainBuffer.fill(360, 360);
    mainBuffer.rectMode(CENTER);
    float radius = size / 2;
    float nameHeight = mainBuffer.textAscent() + mainBuffer.textDescent();
	//Normal position (upper left corner)
	if (posX - mainBuffer.textWidth(name) - radius - 3 > 0 && posY - nameHeight - 8 - radius > 0) {
		mainBuffer.rect(posX + offsetX - mainBuffer.textWidth(name) / 2 - radius - 3, posY - nameHeight - radius, mainBuffer.textWidth(name) + 6, nameHeight + 8, 10, 10, 0, 10);
		mainBuffer.fill(150);
		mainBuffer.text(name, posX + offsetX - mainBuffer.textWidth(name) / 2 - radius - 2, posY - nameHeight - radius + 2);
	}
	//Upper right corner
	else if (posX - offsetX - mainBuffer.textWidth(name) - 5 < 0 && posY - nameHeight - 8 - radius > 0) {
		mainBuffer.rect(posX + offsetX + mainBuffer.textWidth(name) / 2 + radius + 3, posY - nameHeight - radius, mainBuffer.textWidth(name) + 8, nameHeight + 8, 10, 10, 10, 0);
		mainBuffer.fill(150);
		mainBuffer.text(name, posX + offsetX + mainBuffer.textWidth(name) / 2 + radius + 4, posY - nameHeight - radius + 2);
	}
	//Downer left corner
	else if (posX - mainBuffer.textWidth(name) - radius - 3 > 0 && posY + nameHeight + radius < bubbleHeight) {
		mainBuffer.rect(posX + offsetX - mainBuffer.textWidth(name) / 2 - radius - 3, posY + nameHeight + radius, mainBuffer.textWidth(name) + 8, nameHeight + 8, 10, 0, 10, 10);
		mainBuffer.fill(150);
		mainBuffer.text(name, posX + offsetX - mainBuffer.textWidth(name) / 2 - radius - 3, posY + nameHeight + radius);
	}
	//Downer right corner
	else {
		mainBuffer.rect(posX + offsetX + mainBuffer.textWidth(name) / 2 + radius + 3, posY + nameHeight + radius, mainBuffer.textWidth(name) + 8, nameHeight + 8, 0, 10, 10, 10);
		mainBuffer.fill(150);
		mainBuffer.text(name, posX + offsetX + mainBuffer.textWidth(name) / 2 + radius + 3, posY + nameHeight + radius);
	}
    mainBuffer.strokeWeight(stdStrokeWeight);
    mainBuffer.stroke(0);
   	mainBuffer.rectMode(CORNER);
  }

  void  drawLine(int beginX, int beginY, int endX, int endY, int col, boolean clicked) {
    mainBuffer.stroke(this._useColor ? col : this._defaultColor, this._defaultSaturation, this._defaultBrightness, this._defaultAlphaValue);
    mainBuffer.strokeWeight(3);
    mainBuffer.line(beginX + offsetX, beginY, endX + offsetX, endY);
    mainBuffer.stroke(0);
    mainBuffer.strokeWeight(stdStrokeWeight);
  }

  void	drawScale(int axis, float min, float max, int steps) {
	int	stepSize;
	String value;
	float maxUp = max;
	float minDown = min;
	int tmpValueStep = ceil((abs(maxUp) + abs(minDown)) / (steps));
	int valueStep = abs(tmpValueStep);
	mainBuffer.textSize(13);
	mainBuffer.strokeWeight(2);
	mainBuffer.stroke(0, 0, 270, 270);
	// X AXIS -- Y GRID
	if (axis == 0) {
		stepSize = bubbleWidth / steps;
		mainBuffer.line(offsetX - 1, height - offsetY + 1, width, height - offsetY + 1);
		mainBuffer.strokeWeight(stdStrokeWeight);
		mainBuffer.fill(255, 70);
		for (int i = 1; i < steps; ++i) {
			value = truncValue(calcValue(maxUp, valueStep, i, minDown));
			mainBuffer.fill(30, 70);
			if (i == 1)
				mainBuffer.text(truncValue(minDown), stepSize - mainBuffer.textWidth(truncValue(minDown)) / 2, height - offsetY + textAscent() + 2);
			mainBuffer.text(value, (i + 1) * stepSize - mainBuffer.textWidth(value) / 2, height - offsetY + textAscent() + 2);
		}
	}
	// Y AXIS -- X GRID
	else {
		stepSize = bubbleHeight / steps;
		mainBuffer.line(offsetX - 1, 0, offsetX - 1, bubbleHeight);
		mainBuffer.strokeWeight(stdStrokeWeight);
		mainBuffer.fill(255, 70);
		for (int i = 1; i < steps; ++i) {
			value = truncValue(calcValue(maxUp, valueStep, i, minDown));
			mainBuffer.fill(30, 70);
			mainBuffer.pushMatrix();
			mainBuffer.translate(offsetX - mainBuffer.textWidth(value) / 2 - 5, height - offsetY - stepSize * i);
			mainBuffer.rotate(-0.6);
			mainBuffer.text(value, 4, 0);
			mainBuffer.popMatrix();
			if (i == steps - 1)
			{
				mainBuffer.pushMatrix();
				mainBuffer.translate(offsetX - mainBuffer.textWidth(truncValue(minDown)) / 2 - 5, stepSize * (i + 1));
				mainBuffer.rotate(-0.6);
				mainBuffer.text(truncValue(minDown), 4, 0);
				mainBuffer.popMatrix();
			}
		}
	}
	mainBuffer.stroke(0);
  }

  void	drawCoordInfos(int xVal, int posX, int yVal, int posY, int sizeVal, int size, int colVal, int col) {
  	mainBuffer.textAlign(LEFT, TOP);
    mainBuffer.strokeWeight(1.5);
    mainBuffer.stroke(0);
    mainBuffer.textSize(13);
    mainBuffer.fill(360);
    (int)yVal;
    (int)xVal;
    float valueHeight = mainBuffer.textAscent() + mainBuffer.textDescent();
	this._useSize ? round(size) : size = this._defaultSize;
	// AXE X
	int newX = round(xVal);
	if (posX + offsetX + mainBuffer.textWidth(newX) + 8 > width) {
		mainBuffer.rect(width - mainBuffer.textWidth(newX) - 9, bubbleHeight + mainBuffer.textDescent() - 2, mainBuffer.textWidth(newX) + 8, valueHeight + 5, 0, 0, 0, 0);
		mainBuffer.fill(0);
		mainBuffer.text(newX, width - mainBuffer.textWidth(newX) - 5, bubbleHeight + mainBuffer.textDescent());
	}
	else {
		mainBuffer.rect(posX + offsetX - (mainBuffer.textWidth(newX) + 8) / 2, bubbleHeight + mainBuffer.textDescent() - 2, mainBuffer.textWidth(newX) + 8, valueHeight + 5, 0, 0, 0, 0);
		mainBuffer.fill(0);
		mainBuffer.text(newX, posX + offsetX - (mainBuffer.textWidth(newX) + 8) / 2 + 5, bubbleHeight + mainBuffer.textDescent());
	}
	// AXE Y
	int newY = round(yVal);
	mainBuffer.fill(360);
	if (mainBuffer.textWidth(newY) + 8 > offsetX) {
		mainBuffer.rect(0, posY - (valueHeight + 5) / 2, mainBuffer.textWidth(newY) + 8, valueHeight + 5, 0, 0, 0, 0);
		mainBuffer.fill(0);
		mainBuffer.text(newY, 4, posY - (valueHeight + 5) / 2 + 2);
	}
	else {
		mainBuffer.rect(offsetX - mainBuffer.textWidth(newY) - 10, posY - (valueHeight + 5) / 2, mainBuffer.textWidth(newY) + 8, valueHeight + 5, 0, 0, 0, 0);
		mainBuffer.fill(0);
		mainBuffer.text(newY, offsetX - mainBuffer.textWidth(newY) - 5, posY - (valueHeight + 5) / 2 + 2);
	}
	// AXE SIZE - TMP
	/*if (this._useSize) {
		mainBuffer.fill(360);
		mainBuffer.rect(650, 35, mainBuffer.textWidth("size: " + round(sizeVal)) + 8, valueHeight + 5, 0, 0, 0, 0);
		mainBuffer.fill(0);
		mainBuffer.text("size: " + round(sizeVal), 650 + 5, 35 + 2);
	}
	// AXE COLOR - TMP
	if (this._useColor) {
		mainBuffer.fill(360);
		mainBuffer.rect(650, 10, mainBuffer.textWidth("color: " + round(colVal)) + 8, valueHeight + 5, 0, 0, 0, 0);
		mainBuffer.fill(0);
		mainBuffer.text("color: " + round(colVal), 650 + 5, 10 + 2);
	}*/

	mainBuffer.strokeWeight(stdStrokeWeight, this._defaultAlphaValue);
    mainBuffer.stroke(0);
   	mainBuffer.textAlign(CENTER, CENTER);
  }

  void	adjustOpacity(int val) {
  	this._interfaceAlphaValue = val;
  	this._alphaValue = this._interfaceAlphaValue;
  }

  void	bubbleSelected() {
  	this._alphaValue = this._interfaceAlphaValue;
  }

  void	noBubbleSelected() {
  	this._alphaValue = this._defaultAlphaValue;
  }

  void	useColor(boolean use) {
  	this._useColor = use;
  }

  void	useSize(boolean use) {
  	this._useSize = use;
  }

  void	setSize(size) {
  	this._interfaceSizeValue = size;
  }

  void	resetSize() {
  	this._interfaceSizeValue = this._defaultSize;
  }

  String truncValue(value) {
  	value = round(value);
  	if (abs(value) >= 1000000000) {
  		value = value / 1000000;
  		value = round(value);
  		value += "M";
  	}
  	else if (abs(value) >= 1000000) {
  		value /= 1000;
  		value = round(value);
  		value += "k";
  	}
  	return value;
  }

  float calcValue(float max, int valueStep, int i, int min) {
  	float value;
  	int valueLength;
  	float tmp;

  	if (max < 100) {
  		value = ceil(min + valueStep * i);
  	}
  	else {
  		value = ceil(min + valueStep * i);
  		valueLength = nbLength(value);
  		tmp = pow(10, floor(valueLength / 2));
  		value = round(value / tmp) * tmp;
  	}
  	return value;
  }

  int nbLength(float nb) {
  	float tmp = abs(nb);
  	int number = 1;
  	while (tmp >= 10) {
  		tmp /= 10;
  		++number;
  	}
  	return number;
  }

  void	loadingWindow() {
    mainBuffer.textSize(22);
  	float valueHeight = mainBuffer.textAscent() + mainBuffer.textDescent();
  	mainBuffer.stroke(150);
  	mainBuffer.strokeWeight(2);
  	mainBuffer.fill(320);
	mainBuffer.rect(bubbleWidth / 2 - loadingSizeX / 2, bubbleHeight / 2 - loadingSizeY / 2, loadingSizeX, loadingSizeY, 20, 20, 20, 20);
	mainBuffer.fill(0);
  	mainBuffer.textAlign(LEFT, TOP);
	mainBuffer.text(strLoading, bubbleWidth / 2 - mainBuffer.textWidth(strLoading) / 2, bubbleHeight / 2 - loadingSizeY / 2 + valueHeight);
	mainBuffer.strokeWeight(stdStrokeWeight);
    mainBuffer.stroke(0);
   	mainBuffer.textAlign(CENTER, CENTER);
  }

  void	display() {
	redraw();
  }
  
  void  clear() {
    mainBuffer.background(360, 0, 360, 360); // alpha value to 110 for "speed effect"
  }
}