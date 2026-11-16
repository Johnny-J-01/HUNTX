import ClipForge from "./pages/ClipForge.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import SignIn from "./pages/SignIn.jsx";
import SignUp from "./pages/SignUp.jsx";

export default function App() {
	const pathname = window.location.pathname.replace(/\/+$/, "") || "/";

	if (pathname === "/signin") {
		return <SignIn />;
	}

	if (pathname === "/signup") {
		return <SignUp />;
	}

	if (pathname === "/" || pathname === "/index.html") {
		return <LandingPage />;
	}

	// Route /studio, /studio/*, or any unknown path (/abc) to ClipForge
	// to preserve backwards compatibility and ensure the app is never unreachable.
	return <ClipForge />;
}
