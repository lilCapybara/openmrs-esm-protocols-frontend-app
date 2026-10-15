import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Protocolos from './protocolos.component';

const Root: React.FC = () => (
  <BrowserRouter basename={window.getOpenmrsSpaBase()}>
    <Routes>
      <Route path="protocolos" element={<Protocolos />} />
    </Routes>
  </BrowserRouter>
);

export default Root;
