from fastapi import APIRouter, WebSocket, WebSocketDisconnect

from app.services.simulation_service import subscribe, unsubscribe

router = APIRouter()


@router.websocket("/ws")
async def ws_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue = subscribe()
    seq_id = 0
    try:
        # Step 1: Send initial snapshot frame on connect/reconnect
        snapshot_frame = {
            "type": "SNAPSHOT",
            "seq_id": seq_id,
            "status": "CONNECTED",
            "timestamp": "initial_sync",
        }
        await websocket.send_json(snapshot_frame)

        # Step 2: Stream incremental delta frames with monotonic sequence IDs
        while True:
            event = await queue.get()
            seq_id += 1
            if isinstance(event, dict):
                event["seq_id"] = seq_id
                event["frame_type"] = "DELTA"
            await websocket.send_json(event)
    except WebSocketDisconnect:
        pass
    finally:
        unsubscribe(queue)
