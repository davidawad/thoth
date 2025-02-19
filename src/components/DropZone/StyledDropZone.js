import styled from "styled-components";

// Use a transient prop ($isDragAccept) in the styled template.
// This prop will determine styles (e.g. the background color) but will not be forwarded to the DOM.
const StyledDropZone = styled.div`
  background-color: ${({ $isDragAccept }) =>
    $isDragAccept ? "lightgreen" : "lightgray"};
  border: 2px dashed ${({ $isDragAccept }) => ($isDragAccept ? "green" : "red")};
  padding: 20px;
  text-align: center;
`;

export default StyledDropZone;
