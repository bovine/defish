defish-ppm:	defish-ppm.cpp
	g++ -Wall defish-ppm.cpp -o defish-ppm

test:	20110827-fish.jpg defish-ppm
	djpeg -pnm 20110827-fish.jpg | ./defish-ppm | cjpeg > defish.jpg
