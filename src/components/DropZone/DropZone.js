import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import StyledDropZone from "./StyledDropZone";

const DropZone = ({ isDragAccept }) => {
  const onDrop = useCallback((acceptedFiles) => {
    // Process only valid files; they will pass the accept criteria.
    console.log("Accepted Files:", acceptedFiles);
    // (Add your further processing logic here.)
  }, []);

  const onDropRejected = useCallback((fileRejections) => {
    // Log or handle files rejected because of invalid MIME type or file extension.
    console.warn("Rejected Files:", fileRejections);
    // Here you can display a message to the user or simply ignore the file.
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    // This accept configuration tells dropzone which MIME types (and extensions) are allowed.
    accept: {
      "image/jpeg": [".jpeg", ".jpg"],
      "image/png": [".png"],
      "application/pdf": [".pdf"],
    },
  });

  return (
    <StyledDropZone
      $isDragAccept={isDragAccept || isDragActive}
      {...getRootProps()}
    >
      <input {...getInputProps()} />
      {isDragAccept || isDragActive ? "Drop it here!" : "Drag something over"}
    </StyledDropZone>
  );
};

export default DropZone;
