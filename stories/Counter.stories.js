import { expect, userEvent, within } from 'storybook/test';

export default {
  title: 'Reproduction/Counter',
  render: ({ label }) => {
    const button = document.createElement('button');
    let count = 0;
    button.textContent = label + ': ' + count;
    button.addEventListener('click', () => { button.textContent = label + ': ' + ++count; });
    return button;
  },
};

const play = async ({ canvasElement, args }) => {
  const button = within(canvasElement).getByRole('button');
  await userEvent.click(button);
  await expect(button).toHaveTextContent(args.label + ': 1');
};

export const First = { args: { label: 'First' }, play };
export const Second = { args: { label: 'Second' }, play };
