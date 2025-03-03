import React from "react";
import { useDropzone } from "react-dropzone";

const MyDropzone = () => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone();

  // Extract only valid props for the root element
  const { ref, onClick, onDragEnter, onDragOver, onDragLeave, onDrop } =
    getRootProps();

  return (
    <div
      ref={ref}
      onClick={onClick}
      onDragEnter={onDragEnter}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      <input {...getInputProps()} />
      {isDragActive
        ? "Drop the files here ..."
        : "Drag & drop some files here, or click to select files"}
    </div>
  );
};

export default MyDropzone;
