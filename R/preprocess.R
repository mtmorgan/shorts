setwd("/Users/mtmorgan/a/git/shorts/R")
library(dplyr)
requireNamespace("exiftoolr")
requireNamespace("jsonlite")

images_path <- "../static/images"
images <- dir(images_path, pattern = "\\.jpeg", full.names = TRUE)
json_path <- file.path(images_path, "mushrooms.json")

##
## Extract exif information from images, calculate elapsed and start
## times, write to 'woods.json'
##

img_tbl <-
    exiftoolr::exif_read(
        images,
        ## tags = c(
        ##     "FileName", "CreateDate", "ImageWidth", "ImageHeight", "XResolution"
        ## )
    ) |>
    unclass() |>
    as_tibble() |>
    mutate(
        Who = sub(".*:", "", Subject),
        CreateDate = as.POSIXct(CreateDate, format = "%Y:%m:%d %H:%M:%S")
    ) |>
    select(FileName, CreateDate, Who, GPSLatitude, GPSLongitude)
    
jsonlite::write_json(
    img_tbl,
    json_path
)

library(ggplot2)

## A couple of images seem to be off property...
xx <-
    img_tbl |>
    filter(!FileName %in% c("IMG_5989.jpeg", "IMG_2161.jpeg")) |>
    ggplot() +
    aes(x = GPSLongitude, y = GPSLatitude , color = Who, label = FileName) +
    geom_point() +
    geom_label()
