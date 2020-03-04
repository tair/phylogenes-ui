<template>
    <component
                :is="cellComponent"
                ref="myCom"
                :content.sync="compContent"
                v-on:update:content="onUpdateTest"
                v-on:destroyed="onDestroyed"
                @clicked="onClick"
        >

    </component>
</template>

<script>
    import cellDefault from '../cells/DefaultCell';
    import cellLink from '../cells/LinkCell';
    import cellAnnotation from '../cells/AnnotationCell';
    import cellMsa from '../cells/MSACell';
    import cellSlanted from '../cells/SlantedCell';

    export default {
        name: "base-cell",
        props: ["content"],
        components: {
            cellDefault: cellDefault,
            cellLink: cellLink,
            cellAnnotation: cellAnnotation,
            cellMsa: cellMsa,
            cellSlanted: cellSlanted
        },
        data() {
            return {
                
            }
        },
        watch: {
            content: {
                handler(newV, oldV) {
                }
            }
        },
        mounted() {
          
        },
        computed: {
            cellComponent() {
                if(!this.content || !this.content.type) return 'cell-default';
                return 'cell-' + this.content.type.toLowerCase();
            },
            compContent: {
                get: function() {
                    if(!this.content) return {text: ""};
                    return this.content;
                },
                set: function(newV) {
                    this.content = newV;
                }
            }
        },
        methods: {
            onClick() {
                 
            },
            onUpdateTest(val) {
                this.$emit('update:content', val);
            },
            onDestroyed(val) {
                this.$emit('destroyed', val);
            }
        }
    }
</script>

