import React, { useEffect, useRef, useState } from 'react';
import s from "@/styles/Canvas.module.scss"
import { observer } from "mobx-react-lite";
import clsx from 'clsx';
import canvasState from "../store/canvasState";
import toolState from "../store/toolState";
import Brush from "../tools/Brush";
import Rect from "../tools/Rect";
import axios from 'axios'

const Canvas = observer(({
  canvasId
}) => {
  const canvasRef = useRef()
  const usernameRef = useRef()

  // получение холста с бэкенда
  React.useEffect(() => {
    // console.log(router);
    canvasState.setCanvas(canvasRef.current)
    let ctx = canvasRef.current.getContext('2d')
    axios.get(`http://localhost:5000/image?id=${canvasId}`)
      .then(response => {
        const img = new Image()
        img.src = response.data
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      }).catch(err => {
        console.log(err);

        // холста нет в БД. создаем
        if (err.response.status === 500) {
          axios.post(
            `http://localhost:5000/image?id=${canvasId}`,
            {
              img: canvasRef.current.toDataURL()
            }
          )
        }
      })
  }, [])

  React.useEffect(() => {
    if (canvasState.username) {
      const socket = new WebSocket(`ws://localhost:5000/`);
      canvasState.setSocket(socket)
      canvasState.setSessionId(canvasId)
      toolState.setTool(new Brush(canvasRef.current, socket, canvasId))
      socket.onopen = () => {
        console.log('Подключение установлено')
        socket.send(JSON.stringify({
          id: canvasId,
          username: canvasState.username,
          method: "connection"
        }))
      }
      socket.onmessage = (event) => {
        let msg = JSON.parse(event.data)
        switch (msg.method) {
          case "connection":
            console.log(`пользователь ${msg.username} присоединился`)
            break
          case "draw":
            drawHandler(msg)
            break
        }
      }
    }
  }, [canvasState.username])

  const drawHandler = (msg) => {
    const figure = msg.figure
    const ctx = canvasRef.current.getContext('2d')
    switch (figure.type) {
      case "brush":
        Brush.draw(ctx, figure.x, figure.y)
        break
      case "rect":
        Rect.staticDraw(ctx, figure.x, figure.y, figure.width, figure.height, figure.color)
        break
      case "finish":
        ctx.beginPath()
        break
    }
  }

  const mouseDownHandler = () => {
    if (!canvasState.username) return

    canvasState.pushToUndo(canvasRef.current.toDataURL())
    axios.post(
      `http://localhost:5000/image?id=${canvasId}`,
      {
        img: canvasRef.current.toDataURL()
      }
    )
      .then(response => console.log(response.data))
      .catch(err => {
        console.log(err);
      })
  }

  const setUser = () => {
    canvasState.setUsername(usernameRef.current.value)
  }

  return (
    <div className={s.canvas}>
      {!canvasState.username ? <div className={s.userForm}>
        <div>Чтобы подключиться, введите ваш позывной:</div>
        <input type="text" ref={usernameRef} />
        <button onClick={() => setUser()}>
          Войти
        </button>
      </div>
        : null
      }
      <canvas
        ref={canvasRef}
        className={clsx(!canvasState.username && s.blur)}
        onMouseUp={() => mouseDownHandler()}
        width={600}
        height={400}
      />
    </div>
  );
});

export default Canvas;
