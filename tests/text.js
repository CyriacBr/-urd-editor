export default `
name: George

<!name: mdr>
const test = context.actor.name;
return 'hi';
</name>

<myCode: mdr>
return {};
</myCode>

<myList>
item1
item2
</myList>

<!myList>
return [''];
</myList>

<!myText>
return '';
</myText>

<!myObj>
return {};
</myObj>

<myObj>
    num: hello
    <nestedCode>
    return '';
    </nestedCode>
    <nestedList>
    George
    Hello
    </nestedList>
    <nestedText>
    actor
    </nestedText>
    val: George
</myObj>

<!myText>
return '';
</myText>`;
