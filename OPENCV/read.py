import cv2 as cv

img = cv.imread('Photos/cat.webp')

cv.imshow('cat' , img)

# gray = cv.cvtColor(img , cv.COLOR_BGR2GRAY)
# cv.imshow('Gray' , gray)

threshold_value = 127  # You can change this value
_, binary_img = cv.threshold(img, threshold_value, 255, cv.THRESH_BINARY)

cv.imshow('Binary Image', binary_img)
cv.waitKey(0)