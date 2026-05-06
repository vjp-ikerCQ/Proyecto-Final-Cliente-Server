import React from 'react';
import './HomeScreen.css';

const HomeScreen = () => {
  return (
    <div className="home-screen">
      <div className="vignette"></div>
      <div className="content">
        <h1 className="medieval-title main-title">Reinos de Cartas</h1>
        <p className="subtitle">Duelo de la Baraja Española</p>
        
        <div className="button-container">
          <button className="medieval-button">Jugar</button>
          <button className="medieval-button secondary">Opciones</button>
          <button className="medieval-button secondary">Créditos</button>
        </div>
      </div>
      
      <div className="footer">
        <p>© 2026 Proyecto Final Cliente-Server</p>
      </div>
    </div>
  );
};

export default HomeScreen;
