import BlankScreen from "./src/screens/BlankScreen";
import { FilmProvider } from "./src/context/FilmContext";

export default function App() {
  return (
    <>
      <FilmProvider>
        <BlankScreen />
      </FilmProvider>
    </>
  );
}
