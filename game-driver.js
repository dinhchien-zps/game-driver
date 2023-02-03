var GameDriver = (function () {

    return {
        init: function () {
            var QC_ClientId = cc.sys.localStorage.getItem("QC_ClientId");
            // var ws = new WebSocket('ws://localhost:3000');
            var ws = new WebSocket('ws://192.168.56.1:3000');



            cc.log("WebSocket init");
            ws.onopen = function (event) {
                cc.log("ws connected ---------------- ");
                ws.send(JSON.stringify({
                    command: "SET_CLIENT_ID",
                    data: QC_ClientId
                }))
            };
            ws.onmessage = function (event) {
                cc.log(">>>>>>>>>>>>>>");
                cc.log(event.data)

                let message = JSON.parse(event.data)

                switch (message.command) {
                    case "SEND_PACKET":
                        // getSocketById trả về socket thứ i lấy trong list đã lưu
                        let socket = fr.GsnClient.getSocketById(message.data.socketId);
                        socket.send(message.data.packetData)
                        break;
                    case "GET_SOCKETS_INFO":
                        // getSocketsInfo trả về list socket đã khởi tạo, data gồm có ip và port
                        let sockets = fr.GsnClient.getSocketsInfo();
                        ws.send(sockets.toString());
                        break;
                    case "SET_CLIENT_ID":
                        cc.sys.localStorage.setItem("QC_ClientId", message.data);
                        break;
                    case "SET_HIGHLIGH":
                        cc.director.getRunningScene().removeChildByName("QC highlight");
                        let dn = new cc.DrawNode();
                        dn.setName("QC highlight");
                        cc.director.getRunningScene().addChild(dn);
                        dn.drawRect(cc.p(message.data.x1, message.data.y1), cc.p(message.data.x2, message.data.y2), cc.color(255, 0, 0, 0), 3, cc.color(255, 0, 0, 255));
                        break;
                    case "PAUSE":
                        cc.director.pause();
                        break;
                    case "RESUME":
                        cc.director.resume();
                        break;
                    case "GET_GAME_TREE":
                        let gameTree = JSON.stringify(GameDriver.getGameTree(cc.director.getRunningScene()));
                        ws.send(gameTree);
                        break;
                    case "DO_ACTION":
                        let targetFilter = message.data.targetFilter;
                        let action = message.data.action;
                        let param = [];
                        for (let i = 0; i < message.data.param.length; i++) {
                            param.push(message.data.param[i]);
                        }

                        let target = GameDriver.getNodeByFilter(targetFilter);
                        target[action](...param);
                        break;

                }

            };
            ws.onclose = function (event) {
                cc.log("ws close");
            }
        },

        getGameTree: function (node) {

            let string = "";
            if (typeof node.getString == "function") {
                string = node.getString();
            }
            let parent = node.getParent();
            let pos = node.getPosition();
            if (parent) {
                posInWorld = parent.convertToWorldSpace(pos);
            } else {
                posInWorld = pos;
            }
            let zOrder = node.getLocalZOrder();

            let rendererSizeWidth = 0;
            let rendererSizeHeight = 0;
            if (node instanceof ccui.Widget) {
                rendererSizeWidth = node.getVirtualRendererSize().width;
                rendererSizeHeight = node.getVirtualRendererSize().height;
            }
            else if (node instanceof cc.Sprite) {
                rendererSizeWidth = node.getTexture().width;
                rendererSizeHeight = node.getTexture().height;
            }


            let info = {
                name: node.getName(),
                x: posInWorld.x,
                y: posInWorld.y,
                zOrder: zOrder,
                width: node.width,
                height: node.height,
                scale: node.scale,
                opacity: node.opacity,
                visible: node.visible,
                anchorX: node.getAnchorPoint().x,
                anchorY: node.getAnchorPoint().y,
                string: string,
                className: node._className ? node._className : "",
                id: node._id ? node._id : "",
                isClickable: node instanceof ccui.Button || node instanceof cc.TableViewCell || node instanceof ccui.TextField,
                rendererSizeWidth: rendererSizeWidth,
                rendererSizeHeight: rendererSizeHeight,
                description: node.getDescription(),
                // qcId: (typeof (node.getQCId) == 'function') ? node.getQCId() : '',
                // qcClass: (typeof (node.getQCClass) == 'function') ? node.getQCClass() : '',
                actionTag: node.actionTag,
            };
            let children = node.getChildren();
            let listChild = [];
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                listChild.push(this.getGameTree(child));
            }
            info.children = listChild;
            return info;
        },

        getNodeByFilter: function (filter) {
            let rootNode = cc.director.getRunningScene();
            let stack = rootNode.getChildren();
            while (stack.length != 0) {
                let currNode = stack.pop();
                let currNodeInfo = {
                    name: currNode.getName(),
                    string: typeof currNode.getString == "function" ? currNode.getString() : '',
                    description: currNode.getDescription(),
                    actionTag: currNode.actionTag,
                    qcId: currNode.qcId,
                    qcClass: currNode.qcClass,
                };

                let found = true;
                for (let key in filter) {
                    if (filter[key] != currNodeInfo[key]) {
                        found = false;
                        let children = currNode.getChildren();
                        for (let i = 0; i < children.length; i++) {
                            stack.push(children[i]);
                        }
                    };
                }

                if (found) {
                    return currNode;
                }
                else {
                    let children = currNode.getChildren();
                    for (let i = 0; i < children.length; i++) {
                        stack.push(children[i]);
                    }
                }
            }
            return null;
        },



    };
})();

GameDriver.init();
