<template>
    <component
                :is="cellComponent"
                ref="myCom"
                :content="compContent"
                @clicked="onClick"
        >

    </component>
</template>

<script>
    import cellDefault from '../cells/DefaultCell';
    import cellLink from '../cells/LinkCell';
    import cellAnnotation from '../cells/AnnotationCell';
    import cellMsa from '../cells/MSACell';

    export default {
        name: "base-cell",
        props: ["content"],
        components: {
            cellDefault: cellDefault,
            cellLink: cellLink,
            cellAnnotation: cellAnnotation,
            cellMsa: cellMsa
        },
        data() {
            return {
                
            }
        },
        mounted() {
        },
        computed: {
            cellComponent() {
                if(!this.content || !this.content.type) return 'cell-default';
                return 'cell-' + this.content.type.toLowerCase();
            },
            compContent() {
                if(!this.content) return {text: ""};
                return this.content;
            }
        },
        methods: {
            onClick() {
                 
            },
        }
    }
</script>

