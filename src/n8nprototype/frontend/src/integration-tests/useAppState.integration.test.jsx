import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppState } from '../components/UseAppState';

describe('Integration test for custom hook using a test component with real fetch', () => {
    it('calls sendTestMessage and updates messages after fetch', async () => {
        // Spy on console.log if needed
        const consoleSpy = jest.spyOn(console, 'log');

        function TestComponent() {
            const { messages, setMessages, webhookUrl, workflows } = useAppState();

            const sendTestMessage = async (msg) => {
                const response = await fetch(webhookUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ message: msg }),
                });
                console.log("JELLE");
                const data = await response.json();
                setMessages((prev) => [...prev, data]);
            };

            return (
                <div>
                    <button onClick={() => sendTestMessage('Test message 1')}>Send 1</button>
                    <div data-testid="workflows">
                        {messages.map((msg, idx) => (
                            <pre key={idx}>{JSON.stringify(msg)}</pre>
                        ))}
                    </div>
                    <div data-testid="messages">
                        {messages.map((msg, idx) => (
                            <pre key={idx}>{JSON.stringify(msg)}</pre>
                        ))}
                    </div>
                </div>
            );
        }

        render(<TestComponent />);
        fireEvent.click(screen.getByText('Send 1'));

        // Increase the timeout for waiting on the asynchronous state update.
        await waitFor(() => {
            expect(screen.getByTestId('messages').childElementCount).toBeGreaterThan(0);
        }, { timeout: 10000 });

        // Optionally, verify that "JELLE" was logged.
        expect(consoleSpy).toHaveBeenCalledWith("JELLE");
        expect(screen.getByTestId('workflows').childElementCount).toBe(1);
        // console.log(worflows)
    });
});