#!/usr/bin/env node

// imports
import readline from 'readline';
import chalk from 'chalk';
import terminalOverwrite from 'terminal-overwrite';

// consts
const log = console.log;
const pendingColour = chalk.yellow;
const correctColour = chalk.green;
const incorrectColour = chalk.red;
const currentColour = chalk.underline.yellow;

// init
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

function typePassage(passage) {
    // initial output of passage to type
    terminalOverwrite(
        currentColour(passage.substring(0, 1)) + 
        pendingColour(passage.substring(1, passage.length))
    );

    // keep track of current and last correct character indices
    let curChar = 0;
    let lastCorrectChar = 0;

    // detect key presses
    process.stdin.on('keypress', (str, key) => {
        // log(key);

        if (key.name === 'c' && key.ctrl) { // ctrl-c - exit
            log('Cancelled');
            process.exit();
        } else if (key.name === 'backspace') { // backspace - delete last char
            curChar = Math.max(curChar - 1, 0);
            lastCorrectChar = Math.min(lastCorrectChar, curChar);
        } else if (key.name === 'return') { // enter - newline
            if (passage.charAt(curChar) === '\n' && 
                lastCorrectChar == curChar) {
                lastCorrectChar++;
            }
            curChar = Math.min(curChar + 1, passage.length);
        } else { // any other key pressed
            if (str === passage.charAt(curChar) && 
                lastCorrectChar === curChar) {
                lastCorrectChar++;
            } 
            // if (passage.charAt(curChar) !== '\n') {
            curChar = Math.min(curChar + 1, passage.length);
        }

        // TODO: strip trailing and leading spaces

        terminalOverwrite(
            correctColour(passage.substring(0, lastCorrectChar)) + 
            incorrectColour(passage.substring(lastCorrectChar, curChar)) + 
            currentColour(passage.substring(curChar, curChar + 1)) + 
            pendingColour(passage.substring(curChar + 1, passage.length))
        );

        if (lastCorrectChar === passage.length) {
            log('Complete');
            log('TODO: log wpm');
            process.exit();
        }
    });

}

let passage = 'lorem\nipsum';
typePassage(passage);

