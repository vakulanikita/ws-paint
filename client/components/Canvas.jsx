import React, { useEffect, useRef, useState } from 'react';
import s from "@/styles/Canvas.module.scss"
import { observer } from "mobx-react-lite";
import canvasState from "../store/canvasState";
import toolState from "../store/toolState";
import Brush from "../tools/Brush";
import { Modal, Button } from "react-bootstrap";
import Rect from "../tools/Rect";
import axios from 'axios'
import { useRouter } from 'next/router';
import clsx from 'clsx';

const Canvas = observer(() => {
  const canvasRef = useRef()
  const usernameRef = useRef()
  const [modal, setModal] = useState(true)
  // const params = useParams()
  // const router = useRouter()
  // console.log(router2);

  const router = {
    query: {
      id: 'f1768a93c14e'
    }
  }

  useEffect(() => {
    // console.log(router);
    canvasState.setCanvas(canvasRef.current)
    let ctx = canvasRef.current.getContext('2d')
    axios.get(`http://localhost:5000/image?id=${router.query.id}`)
      .then(response => {
        const img = new Image()
        img.src = response.data
        img.onload = () => {
          ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
          ctx.drawImage(img, 0, 0, canvasRef.current.width, canvasRef.current.height)
        }
      })
  }, [])

  useEffect(() => {
    if (canvasState.username) {
      const socket = new WebSocket(`ws://localhost:5000/`);
      canvasState.setSocket(socket)
      canvasState.setSessionId(router.query.id)
      toolState.setTool(new Brush(canvasRef.current, socket, router.query.id))
      socket.onopen = () => {
        console.log('Подключение установлено')
        socket.send(JSON.stringify({
          id: router.query.id,
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
    axios.post(`http://localhost:5000/image?id=${router.query.id}`, { img: canvasRef.current.toDataURL() })
      .then(response => console.log(response.data))
  }

  const connectHandler = () => {
    canvasState.setUsername(usernameRef.current.value)
    setModal(false)
  }

  return (
    <div className={s.canvas}>
      {modal ? <div className={s.userForm}>
        <div>Введите ваше имя</div>
        <input type="text" ref={usernameRef} />
        <button onClick={() => connectHandler()}>
          Войти
        </button>
        {/* <Modal show={modal} onHide={() => { }}>
          <Modal.Header >
            <Modal.Title>Введите ваше имя</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <input type="text" ref={usernameRef} />
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => connectHandler()}>
              Войти
            </Button>
          </Modal.Footer>
        </Modal> */}
      </div>
        : null
      }
      <canvas
        ref={canvasRef}
        className={clsx(!canvasState.username && s.blur)}
        onMouseDown={() => mouseDownHandler()}
        width={600}
        height={400}
      />
    </div>
  );
});

export default Canvas;
