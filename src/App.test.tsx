import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from './App';
import { Server } from 'mock-socket';

const URL = 'ws://localhost:8080';

describe('App', () => {
  let mockServer: Server;

  beforeEach(() => {
    mockServer = new Server(URL);
  });

  afterEach(() => {
    mockServer.stop();
  });

  it('renders the username input form initially', () => {
    render(<App />);
    expect(screen.getByText('Enter your name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument();
    expect(screen.getByText('Find a match')).toBeInTheDocument();
  });

  it('shows "Waiting for a match..." after submitting a username', () => {
    render(<App />);
    const usernameInput = screen.getByPlaceholderText('Your name');
    const submitButton = screen.getByText('Find a match');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.click(submitButton);

    expect(screen.getByText('Waiting for a match...')).toBeInTheDocument();
  });

  it('can send and receive messages', async () => {
    mockServer.on('connection', (socket) => {
      socket.send(JSON.stringify({ type: 'match', data: 'You are matched!' }));
      socket.on('message', (data) => {
        const message = JSON.parse(data as string);
        socket.send(JSON.stringify({ text: `Echo: ${message.text}` }));
      });
    });

    render(<App />);

    const usernameInput = screen.getByPlaceholderText('Your name');
    const submitButton = screen.getByText('Find a match');

    fireEvent.change(usernameInput, { target: { value: 'testuser' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("You've been matched!")).toBeInTheDocument();
    });

    const messageInput = screen.getByPlaceholderText('Type a message...');
    const sendButton = screen.getByText('Send');

    fireEvent.change(messageInput, { target: { value: 'Hello' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('Echo: Hello')).toBeInTheDocument();
    });
  });
});
