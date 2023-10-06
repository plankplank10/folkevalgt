import { Link } from "react-router-dom";

export default function Header() {
  return (
    <div className="border-b border-slate-200 w-full h-14 fixed bg-white/80">
      <div className="container mx-auto h-full px-5 flex justify-between items-center ">
        <Link to="/">
          <div className="font-sans text-xl font-bold">Folkevalgt</div>
        </Link>
        <nav className="">
          <ul className="flex space-x-4 font-semibold ">
            <Link to="/">
              <li className="hover:text-sky-400 active:text-sky-600">
                Storting
              </li>
            </Link>
            <Link to="regjering">
              <li className="hover:text-sky-400 active:text-sky-600">
                Regjering
              </li>
            </Link>
            <Link to="representanter">
              <li className="hover:text-sky-400 active:text-sky-600">
                Representanter
              </li>
            </Link>
            <Link to="partier">
              <li className="hover:text-sky-400 active:text-sky-600">
                Partier
              </li>
            </Link>
          </ul>
        </nav>
      </div>
    </div>
  );
}
