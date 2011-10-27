/*
 * C++ utility to convert a PPM image from circular fisheye into rectilinear projection
 */
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>

void chomp(char *buffer)
{
  char *end = strchr(buffer, '\0');
  if (end > buffer && *(end - 1) == '\n') *(--end) = '\0';
  if (end > buffer && *(end - 1) == '\r') *(--end) = '\0';
}

int main(int argc, char *argv[])
{
  char linebuf[1024];

  // read PBM signature.
  if (!fgets(linebuf, sizeof(linebuf), stdin)) abort();
  chomp(linebuf);
  if (strcmp(linebuf, "P6") != 0) abort();
  
  // read dimensions.
  int width, height;
  while (1) {
    if (!fgets(linebuf, sizeof(linebuf), stdin)) abort();
    chomp(linebuf);
    if (linebuf[0] == '#') continue;
    if (sscanf(linebuf, "%d %d", &width, &height) != 2) abort();
    break;
  }
  if (width < 1 || height < 1) abort();
  
  // read bitdepth.
  int bitdepth;
  while (1) {
    if (!fgets(linebuf, sizeof(linebuf), stdin)) abort();
    chomp(linebuf);
    if (linebuf[0] == '#') continue;
    if (sscanf(linebuf, "%d", &bitdepth) != 1) abort();
    break;
  }
  if (bitdepth != 255) abort();
  
  // read pixel data.
  unsigned char *pixels[height];
  for (int i = 0; i < height; i++) {
    pixels[i] = new unsigned char[width * 3];
    if (fread(pixels[i], 3, width, stdin) != (size_t) width) abort();
  }


  // write out new image format.
  int midy = height / 2;
  int midx = width / 2;
  int maxmag = (midy > midx ? midy : midx);
  int circum = 2 * M_PI * maxmag;     // c = 2*pi*r
  printf("P6\n");
  printf("%d %d\n", circum, maxmag);
  printf("%d\n", bitdepth);
  

  char black[3] = {0,0,0};
  for (int y = 0; y < maxmag; y++) {
    for (int x = 0; x < circum; x++) {
      double theta = -1.0 * x / maxmag;       // -(x * 2.0 * M_PI / width);
      double mag = maxmag - y;                // y * 1.0 * maxmag / height;
      int targety = lrint(midy + mag * cos(theta));
      int targetx = lrint(midx + mag * sin(theta));
      if (targety < 0 || targety >= height || targetx < 0 || targetx >= width) {
        fwrite(black, 1, 3, stdout);
      } else {
        fwrite(&pixels[targety][targetx * 3], 1, 3, stdout);
      }
    }
  }

  return 0;
}
