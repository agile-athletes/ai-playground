import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useAppState } from '../components/UseAppState';

describe('Integration test for custom hook using a test component with real fetch', () => {
    // Remove any fetch mocks if they exist
    beforeEach(() => {
    });

    it('calls sendTestMessage and logs "JELLE"', async () => {
        // Spy on console.log to capture its output.
        const consoleSpy = jest.spyOn(console, 'log');

        // Test component that uses the custom hook.
        function TestComponent() {
            const { messages, setMessages, webhookUrl, sendMessage } = useAppState();

            // Function that sends a message, logs "JELLE", and updates state.
            const sendTestMessage = (msg) => {
                const response = sendMessage(msg)
                console.log("JELLE");
            };

            return (
                <div>
                    <button onClick={() => sendTestMessage('New artificial intelligence technology is challenging our core business of on-demand translation.')}>Send 1</button>
                    <div data-testid="messages">
                        {messages.map((msg, idx) => (
                            <pre key={idx}>{JSON.stringify(msg)}</pre>
                        ))}
                    </div>
                </div>
            );
        }

        // Render the test component.
        render(<TestComponent />);

        // Click the button to trigger sendTestMessage.
        fireEvent.click(screen.getByText('Send 1'));

        // Wait until the messages container shows that a new message has been added.
        await waitFor(() => {
            // Check that at least one message element is present.
            expect(screen.getByTestId('messages').childElementCount).toBeGreaterThan(0);
        });

        // Wait for the async update to complete and verify the log.
        expect(consoleSpy).toHaveBeenCalledWith("JELLE");
    });
});
