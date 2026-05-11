import { Cloudinary } from "@cloudinary/url-gen";

export const cld = new Cloudinary({
    cloud: {
        cloudName: "TU_CLOUD_NAME"
    }
});
