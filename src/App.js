import React, { useState, useEffect, useRef } from 'react';

import socketIOClient from 'socket.io-client';

import './App.css';

const socket = socketIOClient('http://localhost:1234');

const App = () => {
  const fileRef = useRef();

  const [user, changeUser] = useState({});
  const [chats, changeChats] = useState({});

  const [openChat, changeOpenChat] = useState('');

  const [id, changeId] = useState('');
  const [message, changeMessage] = useState('');

  useEffect(() => {
    if (localStorage.getItem('USER')) {
      changeUser(JSON.parse(localStorage.getItem('USER')));
      changeChats(JSON.parse(localStorage.getItem('CHATS')));

      socket.emit('setup', JSON.parse(localStorage.getItem('USER')));
    } else {
      fetch('http://localhost:1234/register').then((resp) =>
        resp.json().then(async (response) => {
          localStorage.setItem('USER', JSON.stringify(response));
          localStorage.setItem('CHATS', JSON.stringify({}));

          changeUser(response);

          socket.emit('setup', response);
        })
      );
    }

    socket.on('chat', (chat) => {
      let chatHandler = JSON.parse(localStorage.getItem('CHATS'));

      if (!chatHandler[chat.from]) {
        chatHandler[chat.from] = { chat: [] };
      }
      console.log(chat);
      chatHandler[chat.from]['chat'].push({
        from: chat.from,
        content: chat.content,
      });

      localStorage.setItem('CHATS', JSON.stringify(chatHandler));
      changeChats(chatHandler);
    });
  }, []);

  return (
    <div className="App">
      <div className="myInfos">
        <img
          className="infoPhoto"
          alt={user.id}
          src={
            user.id ? 'http://localhost:1234/avatar/' + user.id + '.jpg' : ''
          }
          onClick={() => fileRef.current.click()}
        />
        <input
          ref={fileRef}
          className="file"
          type="file"
          accept="image/png, image/jpeg"
          onChange={(e) => {
            let file = e.target.files[0];
            let reader = new FileReader();

            reader.readAsDataURL(file);
            reader.onloadend = () => {
              fetch('http://localhost:1234/uploadavatar', {
                headers: { 'Content-Type': 'application/json' },
                method: 'POST',
                body: JSON.stringify({
                  id: user.id,
                  base64: reader.result,
                }),
              }).then(() => window.location.reload());
            };
          }}
        />
        <p className="infoId">{user?.id}</p>
      </div>
      <div className="contactList">
        <div className="list">
          {chats &&
            Object.keys(chats).map((key) => (
              <div
                className="contact"
                key={key}
                onClick={() => {
                  changeOpenChat((previousOpenChat) =>
                    previousOpenChat === key ? '' : key
                  );
                }}
                style={{
                  borderLeft: openChat === key ? '5px solid #727bff' : 'none',
                }}>
                <img
                  className="contactPhoto"
                  alt={key}
                  src={'http://localhost:1234/avatar/' + key + '.jpg'}
                />
                <p className="contactId">{key}</p>
              </div>
            ))}
        </div>
      </div>
      <div className="contactInfo">
        <img
          className="contactPhoto"
          alt={openChat}
          src={'http://localhost:1234/avatar/' + openChat + '.jpg'}
        />
        <p className="contactId">{openChat}</p>
      </div>
      <div className="contactChat">
        {openChat === '' ? (
          <>
            <h1>Bem Vindo ao WhatsApp Clone!</h1>
            <input
              placeholder="Id do usuario"
              onChange={(e) => changeId(e.target.value)}
            />
            <input
              placeholder="Mensagem"
              onChange={(e) => changeMessage(e.target.value)}
            />
            <button
              onClick={() => {
                socket.emit('chat', {
                  to: id,
                  content: message,
                });

                let chatHandler = JSON.parse(localStorage.getItem('CHATS'));

                if (!chatHandler[id]) {
                  chatHandler[id] = { chat: [] };
                }

                chatHandler[id]['chat'].push({
                  from: user.id,
                  content: message,
                });

                localStorage.setItem('CHATS', JSON.stringify(chatHandler));
                changeChats(chatHandler);
              }}>
              Enviar Mesagem
            </button>
          </>
        ) : (
          <>
            <div className="chatArea">
              {chats[openChat] !== undefined &&
                chats[openChat]['chat'].map((chat) => (
                  <div
                    key={chat.from + Math.random() + chat.content}
                    className="message"
                    style={{
                      backgroundColor:
                        chat.from === user.id ? '#d2d2d2' : '#727bff',
                      marginLeft: chat.from === user.id ? 'auto' : 'inherit',
                      marginRight: chat.from !== user.id ? 'auto' : 'inherit',
                    }}>
                    {chat.content}
                  </div>
                ))}
            </div>
            <div className="inputArea">
              <input
                className="input"
                type="text"
                onChange={(e) => changeMessage(e.target.value)}
              />
              <button
                className="sendButton"
                onClick={() => {
                  socket.emit('chat', {
                    to: openChat,
                    content: message,
                  });

                  let chatHandler = JSON.parse(localStorage.getItem('CHATS'));

                  chatHandler[openChat]['chat'].push({
                    from: user.id,
                    content: message,
                  });

                  localStorage.setItem('CHATS', JSON.stringify(chatHandler));

                  changeChats(chatHandler);
                }}>
                {'>'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default App;
