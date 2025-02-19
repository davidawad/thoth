import "../styles/globals.css";
import "../src/App.css";
import "../src/components/Reader/Reader.css";
import "../src/components/FileParser/FileParser.css";
import "../src/components/ModalWrapper/ModalWrapper.css";

function MyApp({ Component, pageProps }) {
  return <Component {...pageProps} />;
}

export default MyApp;
