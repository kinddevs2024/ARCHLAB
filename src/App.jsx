import { } from 'react'
import { Route, Routes, } from 'react-router-dom'
import { Analytics } from "@vercel/analytics/react";  
import './App.css'
import Loyaout from './Layout/Loyaout'
import Home from './pages/Home/Home'
import { useState,  } from "react";
import Eror from './pages/Eror-404/Eror'


function App() {

  return (
    <>
      <Loyaout>
        <Routes>
          <Analytics />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<Eror />} />
        </Routes>
      </Loyaout>
    </>
  );
}

export default App;