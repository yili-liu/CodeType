#!/usr/bin/env node

// ---------- imports ---------- 
import readline from 'readline';
import chalk from 'chalk';
import terminalOverwrite from 'terminal-overwrite';

// ---------- consts ---------- 
const log = console.log;
const pendingColour = chalk.yellow;
const correctColour = chalk.green;
const incorrectColour = chalk.red;
const currentColour = chalk.underline.yellow;

// ---------- init ---------- 
readline.emitKeypressEvents(process.stdin);
process.stdin.setRawMode(true);

// ---------- functions ---------- 

function stripLeadingNewlines(text) {
    // remove leading newlines and maybe whitespaces
    let lastNewline = 0;
    for (let i = 0; i < text.length; i++) {
        if (text.charAt(i) === '\n') {
            lastNewline = i;
        } else if (text.charAt(i) !== ' '  &&
                   text.charAt(i) !== '\t') {
            return text.substring(lastNewline + 1);
        }
    }
    return text;
}

function stripTrailingWhitespaces(text) {
    // remove trailing newlines
    while (text.charAt(text.length - 1) === '\n' || 
           text.charAt(text.length - 1) === ' ' || 
           text.charAt(text.length - 1) === '\t') {
        text = text.substring(0, text.length - 1);
    }
    return text;
}

function stripWhitespacesBeforeNewlines(text) {
    for (let i = text.length - 1; i >= 0; i--) {
        if (text.charAt(i) !== '\n') {
            continue;
        }
        while (text.charAt(i - 1) === ' ' || text.charAt(i - 1) === '\t') {
            // TODO: is substring() too slow?
            text = text.substring(0, i - 1) 
                + text.substring(i, text.length);
            i--;
        }
    }
    return text;
}

function cleanPassage(passage) {
    // ensure passage does not start with \n chars
    passage = stripLeadingNewlines(passage);
    // ensure passage does not end with \n chars or whitespaces
    passage = stripTrailingWhitespaces(passage);
    // ensure no whitespaces right before newlines
    passage = stripWhitespacesBeforeNewlines(passage);
    return passage;
}

function typePassage(passage) {
    passage = cleanPassage(passage);

    // output initial passage to type
    terminalOverwrite(
        currentColour(passage.substring(0, 1)) + 
        pendingColour(passage.substring(1, passage.length))
    );

    // keep track of current and last correct character indices,
    // and if user is on newline to bypass leading whitespaces
    let curChar = 0;
    let lastCorrectChar = 0;
    let newline = true;

    // detect key presses
    process.stdin.on('keypress', (str, key) => {
        // log(key);

        if (key.name === 'c' && key.ctrl) { // ctrl-c - exit
            log('Cancelled');
            process.exit();
        } else if (key.name === 'backspace') { // backspace - delete last char
            curChar = Math.max(curChar - 1, 0);
            lastCorrectChar = Math.min(lastCorrectChar, curChar);

            // remove tabs
            while (passage.charAt(curChar) === '\t') {
                if (lastCorrectChar === curChar) lastCorrectChar--;
                curChar--;
            }
        } else {
            if (lastCorrectChar === curChar && 
                ((key.name === 'return' && 
                    passage.charAt(curChar) === '\n') || // enter - newline
                    str === passage.charAt(curChar))) { // any other key pressed
                lastCorrectChar++;
            }
            // TODO: should wrong chars at end of line go to next line?
            // if (passage.charAt(curChar) !== '\n') {
            curChar = Math.min(curChar + 1, passage.length);

            while (passage.charAt(curChar) === '\t') {
                if (lastCorrectChar === curChar) lastCorrectChar++;
                curChar++;
            }
        }

        // TODO: ignore leading spaces and tabs
        // not stripping them in the beginning to maintain visual indentation

        // display progress of passage
        // TODO: is concatenation too slow?
        terminalOverwrite(
            correctColour(passage.substring(0, lastCorrectChar)) + 
            incorrectColour(passage.substring(lastCorrectChar, curChar)) + 
            currentColour(passage.substring(curChar, curChar + 1)) + 
            pendingColour(passage.substring(curChar + 1, passage.length))
        );

        // exit if entire passage is typed correctly
        if (lastCorrectChar === passage.length) {
            log('Complete');
            log('TODO: log wpm');
            process.exit();
        }
    });

}

// let test = '   \n\n\t\n \t\n   \ntesting  \n\n\t \n';
let test = '   \n\n\t\n \t\n   testing  \n\n\t \n';
// let trailingSpacesTabs = 'for {   \n\tSystem.out.println(i);\n}';
// let leadingSpacesTabs = 'for {\n    System.out.println(i);\n\t}';
typePassage(test);

