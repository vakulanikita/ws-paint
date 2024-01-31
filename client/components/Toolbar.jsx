import React from 'react';
import s from "@/styles/Toolbar.module.scss"
import toolState from "../store/toolState";
import Brush from "../tools/Brush";
import canvasState from "../store/canvasState";
import Rect from "../tools/Rect";
import Line from "../tools/Line";
import Circle from "../tools/Circle";
import Eraser from "../tools/Eraser";
import clsx from 'clsx'

const Toolbar = () => {

  const changeColor = e => {
    toolState.setStrokeColor(e.target.value)
    toolState.setFillColor(e.target.value)
  }

  const download = () => {
    const dataUrl = canvasState.canvas.toDataURL()
    console.log(dataUrl)
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = canvasState.sessionid + ".jpg"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  React.useEffect(() => {
    // console.log(toolState);
  }, [toolState])

  return (
    <div className={s.toolbar}>
      <button
        className={clsx(s.toolbarBtn, s.brush)}
        onClick={() => toolState.setTool(new Brush(canvasState.canvas, canvasState.socket, canvasState.sessionid))}
      />
      <button
        className={clsx(s.toolbarBtn, s.rect)}
        onClick={() => toolState.setTool(new Rect(canvasState.canvas, canvasState.socket, canvasState.sessionid))}
      />
      <button
        className={clsx(s.toolbarBtn, s.circle)}
        onClick={() => toolState.setTool(new Circle(canvasState.canvas))}
      />
      <button
        className={clsx(s.toolbarBtn, s.eraser)}
        onClick={() => toolState.setTool(new Eraser(canvasState.canvas))}
      />
      <button
        className={clsx(s.toolbarBtn, s.line)}
        onClick={() => toolState.setTool(new Line(canvasState.canvas))}
      />
      <input
        onChange={e => changeColor(e)}
        style={{ marginLeft: 10 }}
        type="color"
      />

      <button className={clsx(s.toolbarBtn, s.undo)} onClick={() => canvasState.undo()} />
      <button className={clsx(s.toolbarBtn, s.redo)} onClick={() => canvasState.redo()} />
      <button className={clsx(s.toolbarBtn, s.save)} onClick={() => download()} />
    </div>
  );
};

export default Toolbar;
