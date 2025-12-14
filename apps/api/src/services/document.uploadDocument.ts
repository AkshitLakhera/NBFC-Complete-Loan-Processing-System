import cloudinary from "./cloudinaryconfig";
export const uploadImage = async (imagePath : string) => {
try{
    const result=await cloudinary.uploader.upload(imagePath,{
      use_filename: true,
      unique_filename: false,
      overwrite: true,
    });
    console.log('Upload success:', result.secure_url);
    return result.secure_url;
} catch (error) {
    console.error('Upload error:', error);
    if (error instanceof Error) {
        throw new Error(error.message);
    }
  }
};