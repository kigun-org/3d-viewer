// import "@testing-library/jest-dom";
// import { render, screen, fireEvent } from "@testing-library/svelte";
import { expect, describe, test } from 'vitest'

describe('ViewerComponent.svelte', () => {
    test('adds 1 + 2 to equal 3', () => {
        expect(3).toBe(3)
    })
})

// describe('Test Counter.svelte', async () => {
//     it('Initial counter should be 0', async () => {
//         render(Counter);
//         expect(screen.getByText('0')).toBeInTheDocument();
//     });
//     it('Test increase', async () => {
//         render(Counter);
//         const increaseButton = screen.getByText('Increment');
//         // Increase by one
//         await fireEvent.click(increaseButton);
//         // Wait for animation
//         const counter = await screen.findByText('1');
//         expect(counter).toBeInTheDocument();
//     });
// });